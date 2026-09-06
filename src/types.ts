/**
 * VeriRoute Intel SDK Types
 */

// ============================================================================
// Configuration
// ============================================================================

export interface VeriRouteConfig {
  /** Your API key from verirouteintel.com/dashboard */
  apiKey: string;
  /** Base URL for API requests (default: https://api-service.verirouteintel.io) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
}

// ============================================================================
// CNAM Types
// ============================================================================

export interface CnamOptions {
  /** Include spam detection in response */
  includeSpam?: boolean;
}

export interface CnamResult {
  /** The phone number queried */
  number: string;
  /** Caller name (CNAM) */
  cnam: string | null;
  /** Spam classification if includeSpam was true */
  spamType?: 'NONE' | 'SPAM' | 'SCAM' | 'ROBOCALL' | 'TELEMARKETER';
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

export interface CnamResponse {
  data: CnamResult;
  errors: string[];
}

// ============================================================================
// LRN Types
// ============================================================================

export interface LrnOptions {
  /** Return only the LRN without additional data */
  lrnOnly?: boolean;
  /** Include enhanced carrier and location data */
  includeEnhanced?: boolean;
  /** Include messaging provider information */
  messagingLookup?: boolean;
  /** Include CNAM (caller name) data */
  includeCnam?: boolean;
  /** Include trust/reputation data with reputation scoring */
  includeTrust?: boolean;
}

export interface EnhancedLrnData {
  /** Carrier name */
  carrier: string;
  /** Carrier type: WIRELESS, LANDLINE, VOIP, etc. */
  carrierType: string;
  /** City */
  city: string;
  /** State abbreviation */
  state: string;
  /** ZIP code */
  zipCode: string;
  /** County name */
  county: string;
  /** Timezone (e.g., America/New_York) */
  timezone: string;
  /** Rate center */
  rateCenter: string;
  /** Local Access and Transport Area */
  lata: string;
  /** Operating Company Number */
  ocn: string;
}

export interface MessagingData {
  /** Messaging service provider */
  provider: string;
  /** Whether messaging is enabled */
  enabled: boolean;
  /** Country name */
  country: string;
  /** ISO country code */
  countryCode: string;
  /** Reference ID for this lookup */
  referenceId?: string;
}

export interface CnamData {
  /** Caller ID name */
  callerName: string | null;
}

export interface TrustData {
  /** Whether this number is flagged as spam */
  isSpam: boolean;
  /** Whether this number is flagged as robocall */
  isRobocall: boolean;
  /** Whether this number is flagged as scam */
  isScam: boolean;
  /** Spam classification */
  spamType: 'NONE' | 'SPAM' | 'SCAM' | 'ROBOCALL' | 'TELEMARKETER';
  /** Reputation score from 0-100 (higher = more trustworthy) */
  reputationScore: number;
  /** Categorical trust level based on reputation score */
  trustLevel: 'high' | 'medium' | 'low';
  /** ISO 8601 timestamp of when data was last updated */
  lastUpdated: string;
}

export interface LrnResult {
  /** The phone number queried */
  phoneNumber: string;
  /** Local Routing Number */
  lrn: string | null;
  /** When the LRN was activated */
  lrnActivatedAt: string | null;
  /** Current carrier name */
  carrier: string;
  /** Line type: mobile, landline, voip, unknown */
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  /** Enhanced data (when includeEnhanced is true) */
  enhanced?: EnhancedLrnData;
  /** Messaging data (when messagingLookup is true) */
  messaging?: MessagingData;
  /** CNAM data (when includeCnam is true) */
  cnam?: CnamData;
  /** Trust data (when includeTrust is true) */
  trust?: TrustData;
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Trust / Spam Types
// ============================================================================

export interface TrustResult {
  /** The phone number queried */
  number: string;
  /** Whether this number is flagged as spam */
  isSpam: boolean;
  /** Whether this number is flagged as robocall */
  isRobocall: boolean;
  /** Whether this number is flagged as scam */
  isScam: boolean;
  /** Spam classification */
  spamType: 'NONE' | 'SPAM' | 'SCAM' | 'ROBOCALL' | 'TELEMARKETER';
  /** Number of complaints filed */
  complaintCount: number;
  /** Subjects/categories of complaints */
  subjects: string[];
  /** First time this number was reported */
  firstReported: string | null;
  /** Last time this number was reported */
  lastReported: string | null;
  /** Additional details */
  details: string;
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

/** Raw API response for trust endpoint (uses snake_case from API) */
export interface TrustResponse {
  data: {
    number: string;
    is_spam: boolean;
    is_robocall: boolean;
    is_scam: boolean;
    spam_type: string;
    complaint_count: number;
    subjects: string[];
    first_reported: string | null;
    last_reported: string | null;
    details: string;
  };
  errors: string[];
}

/** Trust v2 result with reputation scoring */
export interface TrustResultV2 {
  /** The phone number queried */
  number: string;
  /** Whether this number is flagged as spam */
  isSpam: boolean;
  /** Whether this number is flagged as robocall */
  isRobocall: boolean;
  /** Whether this number is flagged as scam */
  isScam: boolean;
  /** Spam classification */
  spamType: 'NONE' | 'SPAM' | 'SCAM' | 'ROBOCALL' | 'TELEMARKETER';
  /** Number of complaints filed */
  complaintCount: number;
  /** Subjects/categories of complaints */
  subjects: string[];
  /** First time this number was reported */
  firstReported: string | null;
  /** Last time this number was reported */
  lastReported: string | null;
  /** Additional details */
  details: string;
  /** Reputation score from 0-100 (higher = more trustworthy) */
  reputationScore: number;
  /** Categorical trust level based on reputation score */
  trustLevel: 'high' | 'medium' | 'low';
  /** ISO 8601 timestamp of when data was last updated */
  lastUpdated: string;
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

/** Raw API response for trust v2 endpoint (uses snake_case from API) */
export interface TrustResponseV2 {
  data: {
    number: string;
    is_spam: boolean;
    is_robocall: boolean;
    is_scam: boolean;
    spam_type: string;
    complaint_count: number;
    subjects: string[];
    first_reported: string | null;
    last_reported: string | null;
    details: string;
    reputation_score: number;
    trust_level: string;
    last_updated: string;
  };
  errors: string[];
}

/** API error response format */
export interface ApiErrorResponse {
  error?: string | { code: string; message: string; details?: Record<string, unknown> };
  code?: string;
}

export interface SpamResult {
  /** The phone number queried */
  phoneNumber: string;
  /** Whether this number is flagged as spam */
  isSpam: boolean;
  /** Whether this number is flagged as robocall */
  isRobocall: boolean;
  /** Whether this number is flagged as scam */
  isScam: boolean;
  /** Spam classification */
  spamType: 'NONE' | 'SPAM' | 'SCAM' | 'ROBOCALL' | 'TELEMARKETER';
  /** Whether result was from cache */
  cached: boolean;
  /** Data source */
  source: string;
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

export interface EnhancedSpamOptions {
  /** Query crowdsourced web sources (default: true) */
  includeWebSources?: boolean;
  /** Include Google Custom Search (default: false, has additional provider-side costs) */
  includeGoogle?: boolean;
}

export interface EnhancedSpamResult {
  /** The phone number queried */
  phoneNumber: string;
  /** Whether this number is flagged as spam */
  isSpam: boolean;
  /** Whether this number is flagged as robocall */
  isRobocall: boolean;
  /** Whether this number is flagged as scam */
  isScam: boolean;
  /** Composite spam score, 0-1 */
  spamScore: number;
  /** Composite robocall score, 0-1 */
  robocallScore: number;
  /** Composite scam score, 0-1 */
  scamScore: number;
  /** Overall confidence in the verdict, 0-1 */
  confidence: number;
  /** Total complaints found across sources */
  totalComplaints: number;
  /** Sources that returned a finding */
  sources: string[];
  /** Complaint categories (e.g. scam, robocall, telemarketer) */
  categories: string[];
  /** Per-source result details */
  sourceDetails: Record<string, unknown>[];
  /** When the lookup ran (ISO 8601) */
  lookupTime: string | null;
  /** Lookup duration in milliseconds */
  lookupDurationMs: number | null;
  /** Error message if the aggregation partially failed */
  error: string | null;
  /** The untransformed response item - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Spam Report Types
// ============================================================================

export type SpamReportType =
  | 'spam'
  | 'robocall'
  | 'scam'
  | 'telemarketing'
  | 'fraud'
  | 'phishing';

export interface SpamReportOptions {
  /** Type of spam to report */
  reportType: SpamReportType;
  /** Additional details about the spam */
  details?: string;
  /** Content of the message received (for SMS spam) */
  messageContent?: string;
  /** Carrier OCN if known */
  carrierOcn?: string;
}

export interface SpamReportResult {
  /** Whether the report was successful */
  success: boolean;
  /** Confirmation message */
  message: string;
  /** The reported number in E.164 format */
  phoneNumber: string | null;
  /** The report type recorded */
  reportType: string | null;
  /** When the report was recorded (ISO 8601) */
  reportedAt: string | null;
  /** Total complaints on record for this number */
  complaintCount: number | null;
  /** Legacy field - the current API does not return it (reads 0) */
  reportId: number;
  /** Legacy field - the current API does not return it (reads null) */
  carrierId: number | null;
  /** Legacy field - the current API does not return it (reads null) */
  carrierName: string | null;
  /** The untransformed response - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Messaging Types
// ============================================================================

export interface MessagingResult {
  /** The phone number queried */
  phoneNumber: string;
  /** Messaging service provider */
  messagingProvider: string;
  /** Whether messaging is enabled */
  messagingEnabled: boolean;
  /** Country name */
  messagingCountry: string;
  /** ISO country code */
  messagingCountryCode: string;
  /** Reference ID for this lookup */
  referenceId: string;
  /** The untransformed response - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsOptions {
  /** Preset time range */
  preset?: '7d' | '30d' | '90d' | '365d';
  /** Custom start date (ISO format YYYY-MM-DD) */
  startDate?: string;
  /** Custom end date (ISO format YYYY-MM-DD) */
  endDate?: string;
}

export interface AnalyticsResult {
  period: {
    start: string;
    end: string;
  };
  totalLookups: number;
  carrierTypeBreakdown: Record<string, number>;
  spamBreakdown: Record<string, number>;
  providerCategoryBreakdown: Record<string, number>;
  geographicBreakdown: Record<string, number>;
  trends: Array<{
    date: string;
    count: number;
  }>;
  /** The untransformed response - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Usage Types
// ============================================================================

export interface UsageOptions {
  /** Convenience date range: 'day' (24h), 'week' (7d), or 'month' (30d). Defaults to 'month'. */
  period?: 'day' | 'week' | 'month';
  /** Custom start date (ISO format YYYY-MM-DD). Overrides period if provided. */
  startDate?: string;
  /** Custom end date (ISO format YYYY-MM-DD). Overrides period if provided. */
  endDate?: string;
  /** Time series grouping: 'day', 'week', or 'month'. Defaults to 'day'. */
  groupBy?: 'day' | 'week' | 'month';
}

export interface UsageResult {
  /** Total lookups performed */
  totalLookups: number;
  /** Total amount spent in USD */
  totalSpent: number;
  /** Lookups by product (lrn, cnam, spam, messaging, trust) */
  byProduct: Record<string, number>;
  /** Lookups by interface (api, web, batch) */
  byInterface: Record<string, number>;
  /** Spam detection breakdown by type */
  spamBreakdown: Record<string, number>;
  /** Current billing period */
  period: {
    start: string;
    end: string;
  };
  /** Time series data */
  timeSeries: Array<{
    date: string;
    count: number;
    spent: number;
  }>;
  /** The API key this report covers ({id, alias}); undefined for usageAll() */
  apiKey?: {
    id: number;
    alias: string;
  };
}

// ============================================================================
// Export & Status Types
// ============================================================================

export interface ExportHistoryOptions {
  /** ISO date (YYYY-MM-DD), default 30 days ago */
  startDate?: string;
  /** ISO date (YYYY-MM-DD), default today */
  endDate?: string;
  /** Maximum records (default 10000, capped at 50000) */
  limit?: number;
}

export interface StatusComponent {
  /** Component key (web, api, provider, database, cache, workers) */
  key: string;
  /** Human-readable component name */
  name: string;
  /** operational, degraded, or outage */
  status: string;
  /** Detail message when not operational */
  detail: string | null;
}

export interface SystemStatusResult {
  /** Overall status - the worst component (operational, degraded, outage) */
  status: string;
  /** When the status was computed (ISO 8601) */
  updatedAt: string;
  /** Per-component status */
  components: StatusComponent[];
  /** The untransformed response - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

// ============================================================================
// Bulk Types
// ============================================================================

export interface BulkCnamResult {
  results: Array<CnamResult & { phoneNumber: string }>;
  errors: Array<{ phoneNumber: string; error: string }>;
  total: number;
  successful: number;
  failed: number;
  jobId?: string;
  summary?: Record<string, unknown>;
  billing?: Record<string, unknown>;
  timing?: Record<string, unknown>;
}

export interface BulkLrnResult {
  results: Array<LrnResult>;
  errors: Array<{ phoneNumber: string; error: string }>;
  total: number;
  successful: number;
  failed: number;
  jobId?: string;
  summary?: Record<string, unknown>;
  billing?: Record<string, unknown>;
  timing?: Record<string, unknown>;
}

export interface BulkSpamResult {
  results: Array<SpamResult>;
  errors: Array<{ phoneNumber: string; error: string }>;
  total: number;
  successful: number;
  failed: number;
  jobId?: string;
  summary?: Record<string, unknown>;
  billing?: Record<string, unknown>;
  timing?: Record<string, unknown>;
}

// ============================================================================
// Async Job Types
// ============================================================================

export type JobStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'RUNNING'
  | 'AWAITING_PROVIDER'
  | 'COMPLETED'
  | 'FAILED';

export interface SubmitJobOptions {
  /** Include LRN/carrier data (default: true) */
  includeLrn?: boolean;
  /** Include enhanced LRN data (city, state, ZIP, timezone, etc.) */
  includeEnhanced?: boolean;
  /** Include CNAM (caller name) data */
  includeCnam?: boolean;
  /** Include spam/trust data */
  includeTrust?: boolean;
  /** Include messaging provider data */
  includeMessaging?: boolean;
  /** HTTPS URL to POST a job.completed event to when the job finishes */
  webhookUrl?: string;
  /** Shared secret for the webhook HMAC-SHA256 signature */
  webhookSecret?: string;
}

export interface JobInvalidExample {
  /** The rejected input as submitted */
  input: string | null;
  /** Why it was rejected */
  error: string | null;
}

export interface JobSummary {
  /** Numbers submitted (before dedup) */
  submitted: number;
  /** Unique valid numbers the job will process */
  unique: number;
  /** Duplicates removed (charged once) */
  duplicatesRemoved: number;
  /** Invalid numbers skipped (never charged) */
  invalid: number;
  /** Numbers processed so far */
  processed: number;
  /** Numbers that failed */
  failed: number;
  /** Up to 5 examples of invalid inputs (submit response only) */
  invalidExamples: JobInvalidExample[];
}

export interface JobOptionsInfo {
  lrn: boolean;
  enhancedLrn: boolean;
  cnam: boolean;
  spam: boolean;
  messagingProvider: boolean;
}

export interface JobBilling {
  /** Amount reserved from your balance at submission */
  estimatedCost: number | null;
  /** Actual cost, settled on completion */
  actualCost: number | null;
  billingStatus: string | null;
}

export interface JobTiming {
  submittedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
}

export interface JobWebhookInfo {
  /** Whether a webhook_url was supplied at submission */
  configured: boolean;
  /** Delivery status (SUCCESS, FAILED, PENDING) or null */
  status: string | null;
}

export interface JobLinks {
  statusUrl: string | null;
  /** Set once the job completes and results are downloadable */
  resultsUrl: string | null;
}

export interface JobResult {
  /** Job id (UUID) */
  jobId: string;
  /** Current job status */
  status: JobStatus;
  summary: JobSummary;
  options: JobOptionsInfo;
  billing: JobBilling;
  timing: JobTiming;
  webhook: JobWebhookInfo;
  links: JobLinks;
  /** Failure reason when status is FAILED */
  errorMessage: string | null;
  /** The untransformed response - unrecognized fields are preserved here */
  raw?: Record<string, unknown>;
}

export interface JobListResult {
  /** Most recent jobs, newest first (up to 50) */
  jobs: JobResult[];
  count: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface VeriRouteErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | 'INTERNATIONAL_NOT_SUPPORTED'
  | 'INVALID_PHONE_NUMBER'
  | 'MISSING_PHONE_NUMBER'
  | 'INSUFFICIENT_BALANCE'
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';
