import type {
  VeriRouteConfig,
  CnamOptions,
  CnamResult,
  CnamResponse,
  EnhancedSpamOptions,
  EnhancedSpamResult,
  ExportHistoryOptions,
  SystemStatusResult,
  LrnOptions,
  LrnResult,
  TrustData,
  TrustResult,
  TrustResponse,
  TrustResultV2,
  TrustResponseV2,
  SpamResult,
  SpamReportOptions,
  SpamReportResult,
  MessagingResult,
  AnalyticsOptions,
  AnalyticsResult,
  UsageOptions,
  UsageResult,
  BulkCnamResult,
  BulkLrnResult,
  BulkSpamResult,
  SubmitJobOptions,
  JobResult,
  JobListResult,
  JobStatus,
  JobInvalidExample,
  ErrorCode,
} from './types';

import {
  VeriRouteError,
  AuthenticationError,
  RateLimitError,
  InsufficientBalanceError,
  InvalidPhoneError,
  InternationalNotSupportedError,
  TimeoutError,
  NetworkError,
} from './errors';

const SDK_VERSION = '1.2.0';
const DEFAULT_BASE_URL = 'https://api-service.verirouteintel.io';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const JOB_MAX_NUMBERS = 100000;

interface RawBulkResponse {
  job_id?: string;
  results?: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  billing?: Record<string, unknown>;
  timing?: Record<string, unknown>;
}

const BULK_ERROR_STATUSES = new Set(['failed', 'invalid', 'error']);

/**
 * The bulk API embeds failures in the results array with a status field
 * ('success', 'cached', 'failed', 'invalid') instead of returning a
 * separate errors array.
 */
function splitBulkResults(response: RawBulkResponse): {
  okItems: Record<string, unknown>[];
  errors: Array<{ phoneNumber: string; error: string }>;
} {
  const okItems: Record<string, unknown>[] = [];
  const errors: Array<{ phoneNumber: string; error: string }> = [];
  for (const r of response.results ?? []) {
    const status = (r.status ?? 'success') as string;
    if (BULK_ERROR_STATUSES.has(status)) {
      errors.push({
        phoneNumber: (r.number ?? r.phone_number ?? r.original_input ?? '') as string,
        error: (r.error ?? status) as string,
      });
    } else {
      okItems.push(r);
    }
  }
  return { okItems, errors };
}

/**
 * VeriRoute Intel SDK Client
 *
 * @example
 * ```typescript
 * import { VeriRoute } from 'verirouteintel';
 *
 * const vri = new VeriRoute('your_api_key');
 *
 * // CNAM lookup
 * const caller = await vri.cnam('+15551234567');
 * console.log(caller.cnam); // "JOHN DOE"
 *
 * // LRN lookup with enhanced data
 * const info = await vri.lrn('+15551234567', { includeEnhanced: true });
 * console.log(info.carrier); // "Verizon Wireless"
 * console.log(info.enhanced?.city); // "New York"
 * ```
 */
export class VeriRoute {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(apiKeyOrConfig: string | VeriRouteConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.baseUrl = DEFAULT_BASE_URL;
      this.timeout = DEFAULT_TIMEOUT;
      this.retries = DEFAULT_RETRIES;
    } else {
      this.apiKey = apiKeyOrConfig.apiKey;
      this.baseUrl = apiKeyOrConfig.baseUrl || DEFAULT_BASE_URL;
      this.timeout = apiKeyOrConfig.timeout || DEFAULT_TIMEOUT;
      this.retries = apiKeyOrConfig.retries ?? DEFAULT_RETRIES;
    }

    if (!this.apiKey) {
      throw new AuthenticationError('API key is required');
    }
  }

  // ===========================================================================
  // HTTP Layer
  // ===========================================================================

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `verirouteintel-node/${SDK_VERSION}`,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle rate limiting with retry
        if (response.status === 429 && attempt < this.retries) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        // Parse response
        const data = await response.json();

        // Handle errors
        if (!response.ok) {
          throw this.handleErrorResponse(response.status, data as Record<string, unknown>);
        }

        return data as T;
      } catch (error) {
        if (error instanceof VeriRouteError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new TimeoutError();
          } else if (error.message.includes('fetch')) {
            lastError = new NetworkError(error.message);
          } else {
            lastError = error;
          }
        }

        // Retry on network errors
        if (attempt < this.retries) {
          await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }
      }
    }

    throw lastError || new NetworkError();
  }

  private handleErrorResponse(
    statusCode: number,
    data: Record<string, unknown>
  ): VeriRouteError {
    const rawError = data.error;

    // Handle string error format (the jobs endpoints use this shape:
    // { "error": "<message>", "code": "<CODE>" })
    if (typeof rawError === 'string') {
      const code = (data.code as string) || 'SERVER_ERROR';
      return this.errorFromCode(code, rawError, statusCode, undefined);
    }

    // Handle object error format
    const error = rawError as { code?: string; message?: string; details?: Record<string, unknown> } | undefined;

    if (!error) {
      return new VeriRouteError(`Request failed with status ${statusCode}`, 'SERVER_ERROR', statusCode);
    }

    const code = error.code || 'UNKNOWN_ERROR';
    const message = error.message || `Request failed with status ${statusCode}`;
    return this.errorFromCode(code, message, statusCode, error.details);
  }

  private errorFromCode(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ): VeriRouteError {
    switch (code) {
      case 'AUTH_REQUIRED':
      case 'AUTH_FAILED':
        return new AuthenticationError(message);

      case 'RATE_LIMIT_EXCEEDED':
        return new RateLimitError(message);

      case 'INSUFFICIENT_BALANCE':
        return new InsufficientBalanceError(message);

      case 'INVALID_PHONE_NUMBER':
      case 'MISSING_PHONE_NUMBER':
        return new InvalidPhoneError(message, details?.phone_number as string);

      case 'INTERNATIONAL_NOT_SUPPORTED':
        return new InternationalNotSupportedError(
          message,
          details?.phone_number as string,
          details?.detected_country_code as number
        );

      default:
        return new VeriRouteError(message, code as ErrorCode, statusCode, details);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // CNAM Methods
  // ===========================================================================

  /**
   * Look up caller name (CNAM) for a phone number
   *
   * @param phoneNumber - The phone number to look up (E.164 or national format)
   * @param options - Optional settings
   * @returns CNAM result with caller name
   *
   * @example
   * ```typescript
   * const result = await vri.cnam('+15551234567');
   * console.log(result.cnam); // "JOHN DOE"
   *
   * // With spam check
   * const result = await vri.cnam('+15551234567', { includeSpam: true });
   * console.log(result.spamType); // "NONE"
   * ```
   */
  async cnam(phoneNumber: string, options?: CnamOptions): Promise<CnamResult> {
    const response = await this.request<CnamResponse>('POST', '/api/v1/cnam', {
      phone_number: phoneNumber,
      include_spam: options?.includeSpam ?? false,
    });

    // The API returns snake_case spam_type inside data
    const data = response.data as unknown as Record<string, unknown>;
    return {
      number: (data.number ?? phoneNumber) as string,
      cnam: (data.cnam ?? null) as string | null,
      spamType: data.spam_type as CnamResult['spamType'],
      raw: data,
    };
  }

  /**
   * Bulk CNAM lookup for multiple phone numbers (up to 1000)
   *
   * @param phoneNumbers - Array of phone numbers
   * @param options - Optional settings
   * @returns Bulk result with successes and failures
   */
  async cnamBulk(phoneNumbers: string[], options?: CnamOptions): Promise<BulkCnamResult> {
    if (phoneNumbers.length > 1000) {
      throw new VeriRouteError('Maximum 1000 phone numbers per bulk request', 'INVALID_PHONE_NUMBER', 400);
    }

    const response = await this.request<RawBulkResponse>('POST', '/api/v1/cnam/bulk', {
      phone_numbers: phoneNumbers,
      include_spam: options?.includeSpam ?? false,
    });

    const { okItems, errors } = splitBulkResults(response);
    const summary = response.summary ?? {};

    return {
      // Bulk rows carry the caller name as 'cnam_record', not 'cnam'.
      results: okItems.map((r) => ({
        number: (r.number ?? r.phone_number ?? '') as string,
        phoneNumber: (r.number ?? r.phone_number ?? '') as string,
        cnam: (r.cnam ?? r.cnam_record ?? null) as string | null,
        spamType: r.spam_type as CnamResult['spamType'],
        raw: r,
      })),
      errors,
      total: (summary.submitted as number) ?? phoneNumbers.length,
      successful: (summary.succeeded as number) ?? okItems.length,
      failed: (summary.failed as number) ?? errors.length,
      jobId: response.job_id,
      summary: response.summary,
      billing: response.billing,
      timing: response.timing,
    };
  }

  // ===========================================================================
  // LRN Methods
  // ===========================================================================

  /**
   * Look up carrier, line type, and routing information
   *
   * @param phoneNumber - The phone number to look up
   * @param options - Optional settings for enhanced/messaging data
   * @returns LRN result with carrier and line type info
   *
   * @example
   * ```typescript
   * // Basic lookup
   * const info = await vri.lrn('+15551234567');
   * console.log(info.carrier); // "Verizon Wireless"
   * console.log(info.lineType); // "mobile"
   *
   * // With enhanced location data
   * const info = await vri.lrn('+15551234567', { includeEnhanced: true });
   * console.log(info.enhanced?.city); // "New York"
   * console.log(info.enhanced?.state); // "NY"
   *
   * // With messaging provider
   * const info = await vri.lrn('+15551234567', { messagingLookup: true });
   * console.log(info.messaging?.provider); // "Verizon Wireless"
   *
   * // With CNAM and trust data
   * const info = await vri.lrn('+15551234567', { includeCnam: true, includeTrust: true });
   * console.log(info.cnam?.callerName); // "ACME CORP"
   * console.log(info.trust?.reputationScore); // 85
   * console.log(info.trust?.trustLevel); // "high"
   * ```
   */
  async lrn(phoneNumber: string, options?: LrnOptions): Promise<LrnResult> {
    const response = await this.request<Record<string, unknown>>('POST', '/api/v1/lrn', {
      phone_number: phoneNumber,
      lrn_only: options?.lrnOnly ?? false,
      include_enhanced_lrn: options?.includeEnhanced ?? false,
      messaging_lookup: options?.messagingLookup ?? false,
      include_cnam: options?.includeCnam ?? false,
      include_trust: options?.includeTrust ?? false,
    });

    return this.transformLrnResponse(response);
  }

  /**
   * Bulk LRN lookup for multiple phone numbers (up to 1000)
   */
  async lrnBulk(phoneNumbers: string[], options?: LrnOptions): Promise<BulkLrnResult> {
    if (phoneNumbers.length > 1000) {
      throw new VeriRouteError('Maximum 1000 phone numbers per bulk request', 'INVALID_PHONE_NUMBER', 400);
    }

    const response = await this.request<RawBulkResponse>('POST', '/api/v1/lrn/bulk', {
      phone_numbers: phoneNumbers,
      include_enhanced: options?.includeEnhanced ?? false,
      include_messaging: options?.messagingLookup ?? false,
      include_cnam: options?.includeCnam ?? false,
      include_trust: options?.includeTrust ?? false,
    });

    const { okItems, errors } = splitBulkResults(response);
    const summary = response.summary ?? {};

    return {
      results: okItems.map((r) => this.transformLrnResponse(r)),
      errors,
      total: (summary.submitted as number) ?? phoneNumbers.length,
      successful: (summary.succeeded as number) ?? okItems.length,
      failed: (summary.failed as number) ?? errors.length,
      jobId: response.job_id,
      summary: response.summary,
      billing: response.billing,
      timing: response.timing,
    };
  }

  /**
   * The single endpoint returns 'lrn' / 'enhanced_lrn' / a nested 'messaging'
   * object; bulk rows use 'lrn_value' / 'enhanced_lrn_data' / 'voice_provider'
   * and flat 'messaging_*' fields. Accept both.
   */
  private transformLrnResponse(data: Record<string, unknown>): LrnResult {
    const enhanced = (data.enhanced_lrn || data.enhanced || data.enhanced_lrn_data) as
      | Record<string, unknown>
      | undefined;
    let messaging = data.messaging as Record<string, unknown> | undefined;
    if (messaging === undefined && 'messaging_provider' in data) {
      messaging = {
        provider: data.messaging_provider,
        enabled: data.messaging_enabled,
        country: data.messaging_country,
        country_code: data.messaging_country_code,
      };
    }
    const cnam = data.cnam as Record<string, unknown> | string | undefined;
    const trust = data.trust as Record<string, unknown> | undefined;

    // Extract carrier and lineType from enhanced data if not at top level
    // (bulk rows carry the carrier as 'voice_provider')
    const carrier = (data.carrier || data.voice_provider || enhanced?.carrier || '') as string;
    const lineType = (data.line_type || enhanced?.carrier_type || 'unknown') as 'mobile' | 'landline' | 'voip' | 'unknown';

    return {
      phoneNumber: data.phone_number as string,
      lrn: (data.lrn ?? data.lrn_value ?? null) as string | null,
      lrnActivatedAt: data.lrn_activated_at as string | null,
      carrier,
      lineType,
      enhanced: enhanced
        ? {
            carrier: (enhanced.carrier || '') as string,
            carrierType: (enhanced.carrier_type || '') as string,
            city: (enhanced.city || '') as string,
            state: (enhanced.state || '') as string,
            zipCode: (enhanced.zip_code || '') as string,
            county: (enhanced.county || '') as string,
            timezone: (enhanced.timezone || '') as string,
            rateCenter: (enhanced.rate_center || '') as string,
            lata: (enhanced.lata || '') as string,
            ocn: (enhanced.ocn || '') as string,
          }
        : undefined,
      messaging: messaging
        ? {
            provider: ((messaging.messaging_provider || messaging.provider) || '') as string,
            enabled: (messaging.messaging_enabled ?? messaging.enabled ?? false) as boolean,
            country: ((messaging.messaging_country || messaging.country) || '') as string,
            countryCode: ((messaging.messaging_country_code || messaging.country_code) || '') as string,
            referenceId: messaging.reference_id as string | undefined,
          }
        : undefined,
      cnam: cnam
        ? {
            // The API returns cnam as a plain string; accept a legacy
            // object shape too just in case.
            callerName:
              typeof cnam === 'string'
                ? cnam
                : (((cnam as Record<string, unknown>).caller_name ?? null) as string | null),
          }
        : undefined,
      trust: trust
        ? {
            isSpam: (trust.is_spam ?? false) as boolean,
            isRobocall: (trust.is_robocall ?? false) as boolean,
            isScam: (trust.is_scam ?? false) as boolean,
            spamType: (trust.spam_type ?? 'NONE') as TrustData['spamType'],
            reputationScore: (trust.reputation_score ?? 85) as number,
            trustLevel: (trust.trust_level ?? 'high') as TrustData['trustLevel'],
            lastUpdated: (trust.last_updated ?? '') as string,
          }
        : undefined,
      raw: data,
    };
  }

  // ===========================================================================
  // Trust / Spam Methods
  // ===========================================================================

  /**
   * Check phone number reputation and spam status
   *
   * @param phoneNumber - The phone number to check
   * @returns Trust result with spam/scam/robocall flags
   *
   * @example
   * ```typescript
   * const trust = await vri.trust('+15551234567');
   * console.log(trust.isSpam); // false
   * console.log(trust.isRobocall); // false
   * console.log(trust.complaintCount); // 0
   * ```
   */
  async trust(phoneNumber: string): Promise<TrustResult> {
    const response = await this.request<TrustResponse>('POST', '/api/v1/trust', {
      phone_number: phoneNumber,
    });

    const data = response.data;
    return {
      number: data.number,
      isSpam: data.is_spam ?? false,
      isRobocall: data.is_robocall ?? false,
      isScam: data.is_scam ?? false,
      spamType: (data.spam_type || 'NONE') as TrustResult['spamType'],
      complaintCount: data.complaint_count ?? 0,
      subjects: data.subjects ?? [],
      firstReported: data.first_reported ?? null,
      lastReported: data.last_reported ?? null,
      details: data.details ?? '',
      raw: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Check phone number reputation with quantitative scoring (v2)
   *
   * @param phoneNumber - The phone number to check
   * @returns Trust result with reputation score and trust level
   *
   * @example
   * ```typescript
   * const trust = await vri.trustV2('+15551234567');
   * console.log(trust.reputationScore); // 85
   * console.log(trust.trustLevel); // "high"
   * console.log(trust.lastUpdated); // "2026-01-18T12:30:00Z"
   * ```
   */
  async trustV2(phoneNumber: string): Promise<TrustResultV2> {
    const response = await this.request<TrustResponseV2>('POST', '/api/v2/trust', {
      phone_number: phoneNumber,
    });

    const data = response.data;
    return {
      number: data.number,
      isSpam: data.is_spam ?? false,
      isRobocall: data.is_robocall ?? false,
      isScam: data.is_scam ?? false,
      spamType: (data.spam_type || 'NONE') as TrustResultV2['spamType'],
      complaintCount: data.complaint_count ?? 0,
      subjects: data.subjects ?? [],
      firstReported: data.first_reported ?? null,
      lastReported: data.last_reported ?? null,
      details: data.details ?? '',
      reputationScore: data.reputation_score ?? 85,
      trustLevel: (data.trust_level ?? 'high') as TrustResultV2['trustLevel'],
      lastUpdated: data.last_updated ?? '',
      raw: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Quick spam check (lighter weight than trust)
   */
  async spam(phoneNumber: string): Promise<SpamResult> {
    const response = await this.request<Record<string, unknown>>('POST', '/api/v1/spam', {
      phone_number: phoneNumber,
      check_spam: true,
    });

    return {
      phoneNumber: response.phone_number as string,
      isSpam: (response.is_spam ?? false) as boolean,
      isRobocall: (response.is_robocall ?? false) as boolean,
      isScam: (response.is_scam ?? false) as boolean,
      spamType: (response.spam_type ?? 'NONE') as SpamResult['spamType'],
      cached: (response.cached ?? false) as boolean,
      source: (response.source ?? 'unknown') as string,
      raw: response,
    };
  }

  /**
   * Batch spam check for multiple numbers
   */
  async spamBatch(phoneNumbers: string[]): Promise<BulkSpamResult> {
    const response = await this.request<RawBulkResponse>('POST', '/api/v1/spam/batch', {
      phone_numbers: phoneNumbers,
    });

    const { okItems, errors } = splitBulkResults(response);
    const summary = response.summary ?? {};

    return {
      // Batch rows carry the spam source/cache flags as 'spam_source' /
      // 'spam_cached' rather than 'source' / 'cached'.
      results: okItems.map((r) => ({
        phoneNumber: r.phone_number as string,
        isSpam: (r.is_spam ?? false) as boolean,
        isRobocall: (r.is_robocall ?? false) as boolean,
        isScam: (r.is_scam ?? false) as boolean,
        spamType: (r.spam_type ?? 'NONE') as SpamResult['spamType'],
        cached: (r.cached ?? r.spam_cached ?? false) as boolean,
        source: (r.source ?? r.spam_source ?? 'unknown') as string,
        raw: r,
      })),
      errors,
      total: (summary.submitted as number) ?? phoneNumbers.length,
      successful: (summary.succeeded as number) ?? okItems.length,
      failed: (summary.failed as number) ?? errors.length,
      jobId: response.job_id,
      summary: response.summary,
      billing: response.billing,
      timing: response.timing,
    };
  }

  /**
   * Report a phone number as spam/scam/robocall
   *
   * @example
   * ```typescript
   * await vri.spamReport('+15551234567', {
   *   reportType: 'robocall',
   *   details: 'Automated warranty scam call',
   * });
   * ```
   */
  async spamReport(phoneNumber: string, options: SpamReportOptions): Promise<SpamReportResult> {
    const response = await this.request<Record<string, unknown>>('POST', '/api/v1/spam/report', {
      phone_number: phoneNumber,
      report_type: options.reportType,
      details: options.details,
      message_content: options.messageContent,
      carrier_ocn: options.carrierOcn,
    });

    const data = (response.data ?? {}) as Record<string, unknown>;
    return {
      success: (response.success ?? true) as boolean,
      message: (response.message ?? 'Report submitted') as string,
      phoneNumber: (data.phone_number ?? null) as string | null,
      reportType: (data.report_type ?? null) as string | null,
      reportedAt: (data.reported_at ?? null) as string | null,
      complaintCount: (data.complaint_count ?? null) as number | null,
      reportId: (response.report_id ?? 0) as number,
      carrierId: (response.carrier_id ?? null) as number | null,
      carrierName: (response.carrier_name ?? null) as string | null,
      raw: response,
    };
  }

  /**
   * Enhanced multi-source spam lookup with composite scoring
   *
   * Queries the primary provider, crowdsourced complaint sources, and
   * internal user reports, and returns per-category scores (0-1) with a
   * confidence rating. Billed the same as a spam lookup.
   *
   * @example
   * ```typescript
   * const result = await vri.spamEnhanced('+15551234567');
   * console.log(result.spamScore);   // 0.85
   * console.log(result.confidence);  // 0.9
   * console.log(result.sources);     // ['mcl_provider', 'user_reports']
   * ```
   */
  async spamEnhanced(phoneNumber: string, options?: EnhancedSpamOptions): Promise<EnhancedSpamResult> {
    const response = await this.request<{ success?: boolean; data?: Record<string, unknown> }>(
      'POST',
      '/api/v1/spam/lookup/enhanced',
      {
        phone_number: phoneNumber,
        include_web_sources: options?.includeWebSources ?? true,
        include_google: options?.includeGoogle ?? false,
      }
    );

    const data = response.data ?? {};
    return {
      phoneNumber: (data.phone_number ?? phoneNumber) as string,
      isSpam: (data.is_spam ?? false) as boolean,
      isRobocall: (data.is_robocall ?? false) as boolean,
      isScam: (data.is_scam ?? false) as boolean,
      spamScore: (data.spam_score ?? 0) as number,
      robocallScore: (data.robocall_score ?? 0) as number,
      scamScore: (data.scam_score ?? 0) as number,
      confidence: (data.confidence ?? 0) as number,
      totalComplaints: (data.total_complaints ?? 0) as number,
      sources: (data.sources ?? []) as string[],
      categories: (data.categories ?? []) as string[],
      sourceDetails: (data.source_details ?? []) as Record<string, unknown>[],
      lookupTime: (data.lookup_time ?? null) as string | null,
      lookupDurationMs: (data.lookup_duration_ms ?? null) as number | null,
      error: (data.error ?? null) as string | null,
      raw: data,
    };
  }

  // ===========================================================================
  // Messaging Methods
  // ===========================================================================

  /**
   * Look up messaging provider for a phone number
   *
   * @example
   * ```typescript
   * const msg = await vri.messaging('+15551234567');
   * console.log(msg.messagingProvider); // "Verizon Wireless"
   * console.log(msg.messagingEnabled); // true
   * ```
   */
  async messaging(phoneNumber: string): Promise<MessagingResult> {
    const response = await this.request<Record<string, unknown>>('POST', '/api/v1/messaging', {
      phone_number: phoneNumber,
    });

    return {
      phoneNumber: response.phone_number as string,
      messagingProvider: response.messaging_provider as string,
      messagingEnabled: response.messaging_enabled as boolean,
      messagingCountry: response.messaging_country as string,
      messagingCountryCode: response.messaging_country_code as string,
      referenceId: response.reference_id as string,
      raw: response,
    };
  }

  // ===========================================================================
  // Async Jobs (bulk lookups beyond the 1,000-number synchronous cap)
  // ===========================================================================

  /**
   * Submit an async bulk lookup job (up to 100,000 numbers)
   *
   * The job runs in the background at the same per-lookup pricing as the
   * synchronous endpoints. The full estimated cost is reserved from your
   * balance at submission and settled to actual usage on completion.
   * Duplicates are removed (charged once); invalid numbers are skipped,
   * reported, and never charged.
   *
   * Poll jobStatus(jobId), or supply a webhookUrl to receive a
   * 'job.completed' POST when the job finishes. With a webhookSecret, the
   * webhook carries an HMAC-SHA256 X-Webhook-Signature header - verify it
   * with verifyWebhookSignature().
   *
   * @param phoneNumbers - Array of phone numbers (up to 100,000)
   * @param options - Lookup options and webhook settings
   * @returns Job result with jobId, reservation details, and input summary
   *
   * @example
   * ```typescript
   * const job = await vri.submitJob(numbers, {
   *   includeEnhanced: true,
   *   webhookUrl: 'https://example.com/hooks/vri',
   *   webhookSecret: 'your-shared-secret',
   * });
   * console.log(job.jobId);
   * console.log(job.billing.estimatedCost);
   * ```
   */
  async submitJob(phoneNumbers: string[], options?: SubmitJobOptions): Promise<JobResult> {
    if (phoneNumbers.length > JOB_MAX_NUMBERS) {
      throw new InvalidPhoneError(`Maximum ${JOB_MAX_NUMBERS} phone numbers per job`);
    }

    const body: Record<string, unknown> = {
      phone_numbers: phoneNumbers,
      include_lrn: options?.includeLrn ?? true,
      include_enhanced: options?.includeEnhanced ?? false,
      include_cnam: options?.includeCnam ?? false,
      include_trust: options?.includeTrust ?? false,
      include_messaging: options?.includeMessaging ?? false,
    };
    if (options?.webhookUrl) {
      body.webhook_url = options.webhookUrl;
    }
    if (options?.webhookSecret) {
      body.webhook_secret = options.webhookSecret;
    }

    const response = await this.request<Record<string, unknown>>('POST', '/api/v1/jobs', body);
    return this.transformJobResponse(response);
  }

  /**
   * Get status, counts, and billing for one async job
   *
   * Returns live counts; billing.actualCost is set once the job settles and
   * links.resultsUrl once results are downloadable.
   *
   * @example
   * ```typescript
   * const job = await vri.jobStatus(jobId);
   * if (job.status === 'COMPLETED') {
   *   const csv = await vri.jobResults(jobId);
   * }
   * ```
   */
  async jobStatus(jobId: string): Promise<JobResult> {
    const response = await this.request<Record<string, unknown>>('GET', `/api/v1/jobs/${jobId}`);
    return this.transformJobResponse(response);
  }

  /**
   * Download the result CSV for a completed async job
   *
   * @param jobId - The job id returned by submitJob()
   * @returns The result CSV as text
   * @throws VeriRouteError - JOB_NOT_COMPLETED (409) while the job is still
   *   running, JOB_NOT_FOUND (404), or RESULTS_UNAVAILABLE (410) if the
   *   result file has expired
   */
  async jobResults(jobId: string): Promise<string> {
    return this.requestText(`/api/v1/jobs/${jobId}/results`);
  }

  /** Raw-text GET (CSV downloads) with the standard auth and error mapping. */
  private async requestText(path: string, params?: Record<string, string>): Promise<string> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'text/csv',
      'User-Agent': `verirouteintel-node/${SDK_VERSION}`,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), { method: 'GET', headers, signal: controller.signal });

      if (!response.ok) {
        let data: Record<string, unknown> = {};
        try {
          data = (await response.json()) as Record<string, unknown>;
        } catch {
          // Non-JSON error body; fall through to a generic error
        }
        throw this.handleErrorResponse(response.status, data);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof VeriRouteError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new NetworkError(error instanceof Error ? error.message : undefined);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * List this account's most recent async jobs (newest first, up to 50)
   *
   * @example
   * ```typescript
   * const recent = await vri.listJobs();
   * for (const job of recent.jobs) {
   *   console.log(job.jobId, job.status);
   * }
   * ```
   */
  async listJobs(): Promise<JobListResult> {
    const response = await this.request<{ jobs?: Record<string, unknown>[]; count?: number }>(
      'GET',
      '/api/v1/jobs'
    );
    const jobs = (response.jobs ?? []).map((j) => this.transformJobResponse(j));
    return { jobs, count: response.count ?? jobs.length };
  }

  private transformJobResponse(data: Record<string, unknown>): JobResult {
    const summary = (data.summary ?? {}) as Record<string, unknown>;
    const options = (data.options ?? {}) as Record<string, unknown>;
    const billing = (data.billing ?? {}) as Record<string, unknown>;
    const timing = (data.timing ?? {}) as Record<string, unknown>;
    const webhook = (data.webhook ?? {}) as Record<string, unknown>;
    const links = (data.links ?? {}) as Record<string, unknown>;

    return {
      jobId: (data.job_id ?? '') as string,
      status: (data.status ?? 'SUBMITTED') as JobStatus,
      summary: {
        submitted: (summary.submitted ?? 0) as number,
        unique: (summary.unique ?? 0) as number,
        duplicatesRemoved: (summary.duplicates_removed ?? 0) as number,
        invalid: (summary.invalid ?? 0) as number,
        processed: (summary.processed ?? 0) as number,
        failed: (summary.failed ?? 0) as number,
        invalidExamples: ((summary.invalid_examples ?? []) as Record<string, unknown>[]).map(
          (e): JobInvalidExample => ({
            input: (e.input ?? null) as string | null,
            error: (e.error ?? null) as string | null,
          })
        ),
      },
      options: {
        lrn: (options.lrn ?? false) as boolean,
        enhancedLrn: (options.enhanced_lrn ?? false) as boolean,
        cnam: (options.cnam ?? false) as boolean,
        spam: (options.spam ?? false) as boolean,
        messagingProvider: (options.messaging_provider ?? false) as boolean,
      },
      billing: {
        estimatedCost: (billing.estimated_cost ?? null) as number | null,
        actualCost: (billing.actual_cost ?? null) as number | null,
        billingStatus: (billing.billing_status ?? null) as string | null,
      },
      timing: {
        submittedAt: (timing.submitted_at ?? null) as string | null,
        startedAt: (timing.started_at ?? null) as string | null,
        completedAt: (timing.completed_at ?? null) as string | null,
        durationMs: (timing.duration_ms ?? null) as number | null,
      },
      webhook: {
        configured: (webhook.configured ?? false) as boolean,
        status: (webhook.status ?? null) as string | null,
      },
      links: {
        statusUrl: (links.status_url ?? null) as string | null,
        resultsUrl: (links.results_url ?? null) as string | null,
      },
      errorMessage: (data.error_message ?? null) as string | null,
      raw: data,
    };
  }

  // ===========================================================================
  // Analytics & Usage Methods
  // ===========================================================================

  /**
   * Get usage analytics
   *
   * @example
   * ```typescript
   * const analytics = await vri.analytics({ preset: '30d' });
   * console.log(analytics.totalLookups);
   * console.log(analytics.carrierTypeBreakdown);
   * ```
   */
  async analytics(options?: AnalyticsOptions): Promise<AnalyticsResult> {
    const params: Record<string, string> = {};

    if (options?.preset) params.preset = options.preset;
    if (options?.startDate) params.start_date = options.startDate;
    if (options?.endDate) params.end_date = options.endDate;

    const response = await this.request<{ data: Record<string, unknown> }>('GET', '/api/v1/analytics', undefined, params);
    const data = response.data;

    return {
      period: data.period as { start: string; end: string },
      totalLookups: data.total_lookups as number,
      carrierTypeBreakdown: data.carrier_type_breakdown as Record<string, number>,
      spamBreakdown: data.spam_breakdown as Record<string, number>,
      providerCategoryBreakdown: data.provider_category_breakdown as Record<string, number>,
      geographicBreakdown: data.geographic_breakdown as Record<string, number>,
      trends: data.trends as Array<{ date: string; count: number }>,
      raw: data,
    };
  }

  /**
   * Get usage report for current API key
   *
   * @param options - Usage query options
   * @param options.period - Convenience date range: 'day' (24h), 'week' (7d), or 'month' (30d)
   * @param options.startDate - Custom start date (YYYY-MM-DD). Overrides period if provided.
   * @param options.endDate - Custom end date (YYYY-MM-DD). Overrides period if provided.
   * @param options.groupBy - Time series grouping: 'day', 'week', or 'month'
   *
   * @example
   * // Get last 7 days of usage
   * const usage = await vri.usage({ period: 'week' });
   * console.log(usage.totalLookups);
   *
   * @example
   * // Get usage for custom date range
   * const usage = await vri.usage({
   *   startDate: '2024-12-01',
   *   endDate: '2024-12-31',
   *   groupBy: 'week'
   * });
   */
  async usage(options: UsageOptions = {}): Promise<UsageResult> {
    return this.requestUsageReport('/api/v1/reports/usage', options);
  }

  /**
   * Get aggregated usage across ALL of your API keys
   *
   * Same parameters and shape as usage(), but not filtered to the calling
   * key (result.apiKey is undefined).
   *
   * @example
   * ```typescript
   * const usage = await vri.usageAll({ period: 'month' });
   * console.log(usage.totalLookups);
   * ```
   */
  async usageAll(options: UsageOptions = {}): Promise<UsageResult> {
    return this.requestUsageReport('/api/v1/reports/usage/all', options);
  }

  private async requestUsageReport(basePath: string, options: UsageOptions): Promise<UsageResult> {
    const params = new URLSearchParams();
    if (options.period) params.set('period', options.period);
    if (options.startDate) params.set('start_date', options.startDate);
    if (options.endDate) params.set('end_date', options.endDate);
    if (options.groupBy) params.set('group_by', options.groupBy);

    const queryString = params.toString();
    const path = queryString ? `${basePath}?${queryString}` : basePath;

    const response = await this.request<{
      data: {
        api_key?: { id: number; alias: string };
        period: { start: string; end: string };
        summary: { total_lookups: number; total_spent: number };
        by_product: Record<string, number>;
        by_interface: Record<string, number>;
        spam_breakdown: Record<string, number>;
        time_series: Array<{ date: string; count: number; spent: number }>;
      };
    }>('GET', path);

    const data = response.data;
    return {
      totalLookups: data.summary.total_lookups,
      totalSpent: data.summary.total_spent,
      byProduct: data.by_product,
      byInterface: data.by_interface,
      spamBreakdown: data.spam_breakdown,
      period: data.period,
      timeSeries: data.time_series,
      apiKey: data.api_key,
    };
  }

  /**
   * Export lookup history for this API key as CSV
   *
   * Columns include timestamp, phone number, products, amount, LRN, carrier,
   * CNAM, messaging, and spam fields.
   *
   * @param options - Date range and record limit
   * @returns The export CSV as text
   *
   * @example
   * ```typescript
   * const csv = await vri.exportHistory({ startDate: '2026-08-01' });
   * await fs.promises.writeFile('history.csv', csv);
   * ```
   */
  async exportHistory(options: ExportHistoryOptions = {}): Promise<string> {
    const params: Record<string, string> = {};
    if (options.startDate) params.start_date = options.startDate;
    if (options.endDate) params.end_date = options.endDate;
    if (options.limit !== undefined) params.limit = String(options.limit);

    return this.requestText('/api/v1/reports/export', params);
  }

  // ===========================================================================
  // Pricing & Platform Status
  // ===========================================================================

  /**
   * Get the per-lookup rate card
   *
   * Returns the current price per lookup for each product, keyed by product
   * name (e.g. 'lrn', 'enhanced_lrn', 'cnam', 'spam', 'messaging_provider').
   * Useful for estimating cost before a bulk submission.
   *
   * @example
   * ```typescript
   * const rates = await vri.pricing();
   * const cost = rates.lrn * numbers.length;
   * ```
   */
  async pricing(): Promise<Record<string, number>> {
    const response = await this.request<{ success?: boolean; pricing?: Record<string, number> }>(
      'GET',
      '/api/v1/pricing/all'
    );
    return response.pricing ?? {};
  }

  /**
   * Get component-level platform status
   *
   * Cheap connectivity/health check - no API key required and never billed.
   * Component statuses are 'operational', 'degraded', or 'outage'; the
   * top-level status is the worst component.
   *
   * @example
   * ```typescript
   * const s = await vri.status();
   * console.log(s.status); // "operational"
   * for (const c of s.components) console.log(c.name, c.status);
   * ```
   */
  async status(): Promise<SystemStatusResult> {
    const response = await this.request<Record<string, unknown>>('GET', '/api/v1/status');
    const components = (response.components ?? []) as Record<string, unknown>[];
    return {
      status: (response.status ?? 'operational') as string,
      updatedAt: (response.updated_at ?? '') as string,
      components: components.map((c) => ({
        key: (c.key ?? '') as string,
        name: (c.name ?? '') as string,
        status: (c.status ?? 'operational') as string,
        detail: (c.detail ?? null) as string | null,
      })),
      raw: response,
    };
  }

  /**
   * Validate API key
   *
   * @returns true if API key is valid
   */
  async validateKey(): Promise<boolean> {
    try {
      await this.request<{ valid: boolean }>('POST', '/api/v1/auth/validate-key', {
        api_key: this.apiKey,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Alias for shorter import
export { VeriRoute as VRI };
