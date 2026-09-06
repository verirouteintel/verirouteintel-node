/**
 * VeriRoute Intel SDK
 *
 * Official Node.js/TypeScript SDK for VeriRoute Intel phone number intelligence API.
 *
 * @packageDocumentation
 * @module verirouteintel
 *
 * @example
 * ```typescript
 * import { VeriRoute } from 'verirouteintel';
 *
 * const vri = new VeriRoute('your_api_key');
 *
 * // CNAM lookup
 * const caller = await vri.cnam('+15551234567');
 *
 * // LRN with enhanced data
 * const info = await vri.lrn('+15551234567', {
 *   includeEnhanced: true,
 *   messagingLookup: true,
 * });
 *
 * // Spam/reputation check
 * const trust = await vri.trust('+15551234567');
 * ```
 */

// Main client
export { VeriRoute, VRI } from './client';

// Webhooks
export { verifyWebhookSignature } from './webhooks';

// Types
export type {
  VeriRouteConfig,
  CnamOptions,
  CnamResult,
  CnamResponse,
  LrnOptions,
  LrnResult,
  EnhancedLrnData,
  MessagingData,
  TrustResult,
  TrustResponse,
  SpamResult,
  EnhancedSpamOptions,
  EnhancedSpamResult,
  SpamReportType,
  SpamReportOptions,
  SpamReportResult,
  MessagingResult,
  AnalyticsOptions,
  AnalyticsResult,
  UsageOptions,
  UsageResult,
  ExportHistoryOptions,
  StatusComponent,
  SystemStatusResult,
  BulkCnamResult,
  BulkLrnResult,
  BulkSpamResult,
  JobStatus,
  SubmitJobOptions,
  JobResult,
  JobListResult,
  JobSummary,
  JobOptionsInfo,
  JobBilling,
  JobTiming,
  JobWebhookInfo,
  JobLinks,
  JobInvalidExample,
  VeriRouteErrorDetails,
  ErrorCode,
} from './types';

// Errors
export {
  VeriRouteError,
  AuthenticationError,
  RateLimitError,
  InsufficientBalanceError,
  InvalidPhoneError,
  InternationalNotSupportedError,
  TimeoutError,
  NetworkError,
} from './errors';
