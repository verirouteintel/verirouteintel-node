# VeriRoute Intel Node.js SDK

Official Node.js/TypeScript SDK for [VeriRoute Intel](https://verirouteintel.com) phone number intelligence API.

## Features

- **CNAM Lookup** - Caller ID / caller name
- **LRN Lookup** - Carrier, line type, ported number routing
- **Enhanced Data** - City, state, ZIP, timezone, rate center
- **Messaging Provider** - SMS/MMS routing information
- **Spam Detection** - Robocall, scam, and spam flagging
- **Bulk Operations** - Up to 1,000 numbers per request
- **Async Jobs** - Background jobs for up to 100,000 numbers with completion webhooks
- **Webhook Verification** - One-call HMAC-SHA256 signature verification
- **Enhanced Spam** - Multi-source spam lookup with composite scoring
- **Pricing & Status** - Programmatic rate card and platform status

## Endpoint Coverage

| SDK method | Endpoint |
|---|---|
| `cnam()` / `cnamBulk()` | `POST /api/v1/cnam` / `POST /api/v1/cnam/bulk` |
| `lrn()` / `lrnBulk()` | `POST /api/v1/lrn` / `POST /api/v1/lrn/bulk` |
| `messaging()` | `POST /api/v1/messaging` |
| `trust()` / `trustV2()` | `POST /api/v1/trust` / `POST /api/v2/trust` |
| `spam()` / `spamBatch()` | `POST /api/v1/spam` / `POST /api/v1/spam/batch` |
| `spamEnhanced()` | `POST /api/v1/spam/lookup/enhanced` |
| `spamReport()` | `POST /api/v1/spam/report` |
| `submitJob()` / `jobStatus()` / `jobResults()` / `listJobs()` | `POST /api/v1/jobs` / `GET /api/v1/jobs/<id>` / `GET /api/v1/jobs/<id>/results` / `GET /api/v1/jobs` |
| `analytics()` | `GET /api/v1/analytics` |
| `usage()` / `usageAll()` | `GET /api/v1/reports/usage` / `GET /api/v1/reports/usage/all` |
| `exportHistory()` | `GET /api/v1/reports/export` |
| `pricing()` | `GET /api/v1/pricing/all` |
| `status()` | `GET /api/v1/status` |
| `validateKey()` | `POST /api/v1/auth/validate-key` |

The single-number `lrn()` call with `includeEnhanced` / `includeCnam` /
`includeTrust` / `messagingLookup` is the combined-products lookup - one
call, one number, every product you select.

**Unrecognized response fields are preserved**: every typed result carries
the untransformed response item on its `raw` property, so fields added to
the API after this SDK release are never silently dropped.

## Installation

```bash
npm install verirouteintel
```

```bash
yarn add verirouteintel
```

```bash
pnpm add verirouteintel
```

## Quick Start

```typescript
import { VeriRoute } from 'verirouteintel';

const vri = new VeriRoute('your_api_key');

// CNAM - Get caller name
const caller = await vri.cnam('+15551234567');
console.log(caller.cnam); // "JOHN DOE"

// LRN - Get carrier and line type
const info = await vri.lrn('+15551234567');
console.log(info.carrier);  // "Verizon Wireless"
console.log(info.lineType); // "mobile"

// Trust - Check spam reputation
const trust = await vri.trust('+15551234567');
console.log(trust.isSpam);     // false
console.log(trust.isRobocall); // false
```

## API Reference

### Initialization

```typescript
import { VeriRoute } from 'verirouteintel';

// Simple initialization
const vri = new VeriRoute('your_api_key');

// With options
const vri = new VeriRoute({
  apiKey: 'your_api_key',
  baseUrl: 'https://api-service.verirouteintel.io', // optional
  timeout: 30000, // optional, in milliseconds
  retries: 3,     // optional, retry attempts
});
```

### CNAM Lookup

```typescript
// Basic CNAM
const result = await vri.cnam('+15551234567');
console.log(result.cnam);     // "JOHN DOE"
console.log(result.number);   // "+15551234567"

// CNAM with spam check
const result = await vri.cnam('+15551234567', { includeSpam: true });
console.log(result.spamType); // "NONE" | "SPAM" | "SCAM" | "ROBOCALL"

// Bulk CNAM (up to 1,000 numbers)
const bulk = await vri.cnamBulk(['+15551234567', '+15559876543']);
console.log(bulk.results);    // Array of CNAM results
console.log(bulk.successful); // 2
console.log(bulk.failed);     // 0
```

### LRN Lookup (Carrier & Line Type)

```typescript
// Basic LRN
const info = await vri.lrn('+15551234567');
console.log(info.carrier);  // "Verizon Wireless"
console.log(info.lineType); // "mobile" | "landline" | "voip" | "unknown"
console.log(info.lrn);      // "5551230000"

// With enhanced location data
const info = await vri.lrn('+15551234567', { includeEnhanced: true });
console.log(info.enhanced.city);       // "New York"
console.log(info.enhanced.state);      // "NY"
console.log(info.enhanced.zipCode);    // "10001"
console.log(info.enhanced.county);     // "New York County"
console.log(info.enhanced.timezone);   // "America/New_York"
console.log(info.enhanced.rateCenter); // "NWYORK"
console.log(info.enhanced.lata);       // "227"
console.log(info.enhanced.ocn);        // "1001"

// With messaging provider
const info = await vri.lrn('+15551234567', { messagingLookup: true });
console.log(info.messaging.provider);    // "Verizon Wireless"
console.log(info.messaging.enabled);     // true
console.log(info.messaging.country);     // "United States"
console.log(info.messaging.countryCode); // "US"

// With CNAM (caller name)
const info = await vri.lrn('+15551234567', { includeCnam: true });
console.log(info.cnam?.callerName); // "ACME CORP"

// With trust/reputation data
const info = await vri.lrn('+15551234567', { includeTrust: true });
console.log(info.trust?.reputationScore); // 85 (0-100, higher = more trustworthy)
console.log(info.trust?.trustLevel);      // "high" | "medium" | "low"
console.log(info.trust?.isSpam);          // false
console.log(info.trust?.lastUpdated);     // ISO 8601 timestamp

// Full lookup with everything - single API call
const info = await vri.lrn('+15551234567', {
  includeEnhanced: true,
  messagingLookup: true,
  includeCnam: true,
  includeTrust: true,
});

// Bulk LRN with all options
const bulk = await vri.lrnBulk(['+15551234567', '+15559876543'], {
  includeEnhanced: true,
  includeCnam: true,
  includeTrust: true,
});
```

### Trust / Spam Detection

```typescript
// Full reputation check (v1)
const trust = await vri.trust('+15551234567');
console.log(trust.isSpam);         // false
console.log(trust.isRobocall);     // false
console.log(trust.isScam);         // false
console.log(trust.spamType);       // "NONE"
console.log(trust.complaintCount); // 0
console.log(trust.subjects);       // []
console.log(trust.firstReported);  // null
console.log(trust.lastReported);   // null

// Trust v2 - with reputation scoring
const trust = await vri.trustV2('+15551234567');
console.log(trust.reputationScore); // 0-100, higher = more trustworthy
console.log(trust.trustLevel);      // "high" (>=70), "medium" (40-69), "low" (<40)
console.log(trust.lastUpdated);     // ISO 8601 timestamp
console.log(trust.isSpam);          // false
console.log(trust.complaintCount);  // 0

// Quick spam check
const spam = await vri.spam('+15551234567');
console.log(spam.isSpam);    // false
console.log(spam.spamType);  // "NONE"

// Batch spam check
const batch = await vri.spamBatch(['+15551234567', '+15559876543']);

// Enhanced multi-source spam lookup with composite scoring
const enhanced = await vri.spamEnhanced('+15551234567');
console.log(enhanced.spamScore);       // 0.0-1.0 composite spam score
console.log(enhanced.robocallScore);   // 0.0-1.0
console.log(enhanced.confidence);      // 0.0-1.0 confidence in the verdict
console.log(enhanced.sources);         // Sources with a finding
console.log(enhanced.totalComplaints); // Complaints found across sources

// Report spam
const report = await vri.spamReport('+15551234567', {
  reportType: 'robocall', // 'spam' | 'robocall' | 'scam' | 'telemarketing' | 'fraud' | 'phishing'
  details: 'Automated warranty scam call',
  messageContent: 'Your car warranty is expiring...', // optional
});
console.log(report.success);        // true
console.log(report.phoneNumber);    // "+15551234567" (E.164)
console.log(report.complaintCount); // Total complaints now on record
```

### Messaging Provider

```typescript
const msg = await vri.messaging('+15551234567');
console.log(msg.messagingProvider);    // "Verizon Wireless"
console.log(msg.messagingEnabled);     // true
console.log(msg.messagingCountry);     // "United States"
console.log(msg.messagingCountryCode); // "US"
```

### Analytics & Usage

```typescript
// Get analytics
const analytics = await vri.analytics({ preset: '30d' });
console.log(analytics.totalLookups);
console.log(analytics.carrierTypeBreakdown);
console.log(analytics.spamBreakdown);
console.log(analytics.geographicBreakdown);

// Custom date range
const customAnalytics = await vri.analytics({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

// Get usage report - with period parameter
const usage = await vri.usage({ period: 'week' }); // 'day', 'week', or 'month'
console.log(usage.totalLookups);
console.log(usage.totalSpent);
console.log(usage.byProduct);    // { cnam: 100, lrn: 200, spam: 50, ... }
console.log(usage.byInterface);  // { api: 300, web: 50, batch: 0 }
console.log(usage.spamBreakdown); // { spam: 10, scam: 5, robocall: 3 }

// Custom date range (overrides period)
const customUsage = await vri.usage({
  startDate: '2024-12-01',
  endDate: '2024-12-31',
  groupBy: 'week', // Time series grouping
});
for (const entry of customUsage.timeSeries) {
  console.log(`${entry.date}: ${entry.count} lookups, $${entry.spent.toFixed(2)}`);
}

// Aggregated usage across ALL of your API keys (same parameters)
const allUsage = await vri.usageAll({ period: 'month' });
console.log(allUsage.totalLookups);

// Export lookup history for this key as CSV
const csv = await vri.exportHistory({ startDate: '2026-08-01', limit: 5000 });
await fs.promises.writeFile('history.csv', csv);

// Validate API key
const isValid = await vri.validateKey();
```

### Pricing & Platform Status

```typescript
// Current price per lookup for each product - estimate costs programmatically
const rates = await vri.pricing();
console.log(rates); // { lrn: 0.0005, cnam: 0.006, spam: 0.007, ... }
const estimated = rates.lrn * numbers.length;

// Cheap connectivity check - no API key required, never billed
const s = await vri.status();
console.log(s.status); // "operational" | "degraded" | "outage"
for (const component of s.components) {
  console.log(component.name, component.status, component.detail);
}
```

### Async Jobs (up to 100,000 numbers)

For lists beyond the 1,000-number synchronous cap, submit an async job. The
job runs in the background at the same per-lookup pricing; the estimated
cost is reserved from your balance at submission and settled to actual
usage on completion. Duplicates are removed (charged once) and invalid
numbers are skipped, reported, and never charged.

```typescript
// Submit a job
const job = await vri.submitJob(numbers, {
  includeEnhanced: true,
  includeCnam: true,
});
console.log(job.jobId);                 // UUID
console.log(job.status);                // "SUBMITTED"
console.log(job.summary.unique);        // Unique valid numbers to process
console.log(job.summary.invalid);       // Invalid inputs skipped (with examples)
console.log(job.billing.estimatedCost); // Amount reserved from your balance

// Poll for completion
let current = job;
while (current.status !== 'COMPLETED' && current.status !== 'FAILED') {
  await new Promise((r) => setTimeout(r, 5000));
  current = await vri.jobStatus(job.jobId);
}

// Download the result CSV
if (current.status === 'COMPLETED') {
  const csv = await vri.jobResults(job.jobId);
  await fs.promises.writeFile('results.csv', csv);
  console.log(current.billing.actualCost); // Settled cost
}

// List your 50 most recent jobs
const recent = await vri.listJobs();
for (const j of recent.jobs) {
  console.log(j.jobId, j.status);
}
```

### Completion Webhooks

Instead of polling, supply a `webhookUrl` and VeriRoute Intel POSTs a
`job.completed` event when the job finishes. With a `webhookSecret`, the
request carries an HMAC-SHA256 signature in the `X-Webhook-Signature`
header (`sha256=<hex>`), computed over the raw request body:

```typescript
const job = await vri.submitJob(numbers, {
  webhookUrl: 'https://example.com/hooks/vri',
  webhookSecret: 'your-shared-secret',
});
```

Verify the signature in your handler with `verifyWebhookSignature` -
always against the raw body, never re-serialized JSON:

```typescript
import { verifyWebhookSignature } from 'verirouteintel';

// Express: use a raw body parser for this route, NOT express.json()
app.post('/hooks/vri', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.header('X-Webhook-Signature') ?? '';
  const valid = await verifyWebhookSignature(req.body, signature, 'your-shared-secret');
  if (!valid) return res.status(401).end();

  const event = JSON.parse(req.body.toString('utf8'));
  console.log(event.job.id, event.job.status);
  res.status(204).end();
});
```

Webhook URLs must be publicly reachable HTTPS/HTTP addresses; delivery is
retried on failure and your endpoint should answer 2xx within 10 seconds.

## Error Handling

```typescript
import {
  VeriRoute,
  VeriRouteError,
  AuthenticationError,
  RateLimitError,
  InsufficientBalanceError,
  InvalidPhoneError,
  InternationalNotSupportedError,
} from 'verirouteintel';

try {
  const result = await vri.lrn('+15551234567');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof InsufficientBalanceError) {
    console.error('Add credits to your account');
  } else if (error instanceof InvalidPhoneError) {
    console.error(`Invalid phone: ${error.phoneNumber}`);
  } else if (error instanceof InternationalNotSupportedError) {
    console.error('Only US/Canada numbers supported');
  } else if (error instanceof VeriRouteError) {
    console.error(`API error: ${error.code} - ${error.message}`);
  }
}
```

## TypeScript Support

Full TypeScript support with complete type definitions:

```typescript
import type {
  CnamResult,
  LrnResult,
  EnhancedLrnData,
  MessagingData,
  CnamData,
  TrustData,
  TrustResult,
  TrustResultV2,
  SpamResult,
} from 'verirouteintel';

// Types are inferred automatically
const info = await vri.lrn('+15551234567', {
  includeEnhanced: true,
  includeCnam: true,
  includeTrust: true,
});
// info.enhanced is typed as EnhancedLrnData | undefined
// info.cnam is typed as CnamData | undefined
// info.trust is typed as TrustData | undefined
```

## Shorthand Import

```typescript
// Full name
import { VeriRoute } from 'verirouteintel';

// Shorthand
import { VRI } from 'verirouteintel';

const vri = new VRI('your_api_key');
```

## Requirements

- Node.js 16 or later
- Works with Deno, Bun, and modern browsers (via bundler)

## Links

- [API Documentation](https://verirouteintel.com/api-docs)
- [Get API Key](https://verirouteintel.com/register)
- [Pricing](https://verirouteintel.com/pricing)

## Changelog

### 1.3.0

- Async Jobs API: `submitJob()` (up to 100,000 numbers), `jobStatus()`,
  `jobResults()` (result CSV download), `listJobs()`
- `verifyWebhookSignature()` helper for HMAC-SHA256 verification of
  job-completion webhooks (WebCrypto-based; works in Node 18+, Deno, Bun)
- New endpoints: `spamEnhanced()` (multi-source composite scoring),
  `usageAll()` (all API keys), `exportHistory()` (CSV export),
  `pricing()` (rate card), `status()` (platform status)
- Bulk results fixed: bulk LRN rows now populate `lrn`, `carrier`,
  `enhanced`, and `messaging` (the rows use `lrn_value` / `voice_provider` /
  `enhanced_lrn_data` / flat `messaging_*` field names); bulk CNAM rows now
  populate `cnam` (rows use `cnam_record`); batch spam rows now populate
  `source` and `cached` (rows use `spam_source` / `spam_cached`)
- `cnam()` now populates `spamType` (the API returns snake_case `spam_type`)
- `spamReport()` now returns the real response fields (`phoneNumber`,
  `reportType`, `reportedAt`, `complaintCount`); the legacy `reportId` /
  `carrierId` / `carrierName` properties remain but always read 0/null
- `usage()` now exposes the `apiKey` the report covers
- Typed errors (`InsufficientBalanceError`, etc.) now also raised for the
  flat `{ error, code }` response format used by the jobs endpoints
- Every typed result preserves the untransformed response on `raw`, so
  future API fields are never silently dropped
- Bulk fixes: CNAM parsed as a plain string, per-number failures surfaced
  in `errors`, canonical bulk parameter names

## License

MIT
