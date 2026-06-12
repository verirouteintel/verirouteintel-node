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
  /** Report ID for reference */
  reportId: number;
  /** Carrier ID if identified */
  carrierId: number | null;
  /** Carrier name if identified */
  carrierName: string | null;
  /** Confirmation message */
  message: string;
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
