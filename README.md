# VeriRoute Intel Node.js SDK

Official Node.js/TypeScript SDK for [VeriRoute Intel](https://verirouteintel.com) phone number intelligence API.

## Features

- **CNAM Lookup** - Caller ID / caller name
- **LRN Lookup** - Carrier, line type, ported number routing
- **Enhanced Data** - City, state, ZIP, timezone, rate center
- **Messaging Provider** - SMS/MMS routing information
- **Spam Detection** - Robocall, scam, and spam flagging
- **Bulk Operations** - Up to 1,000 numbers per request

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

// Report spam
await vri.spamReport('+15551234567', {
  reportType: 'robocall', // 'spam' | 'robocall' | 'scam' | 'telemarketing' | 'fraud' | 'phishing'
  details: 'Automated warranty scam call',
  messageContent: 'Your car warranty is expiring...', // optional
});
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

// Validate API key
const isValid = await vri.validateKey();
```

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

## License

MIT
