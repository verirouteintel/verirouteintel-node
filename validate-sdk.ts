#!/usr/bin/env npx ts-node
/**
 * SDK Validation Script
 *
 * Tests the TypeScript SDK against the live API to verify response structures match.
 * Run with: npx ts-node validate-sdk.ts <api_key> [phone_number]
 */

import { createHmac } from 'crypto';

import { VeriRoute, VRI, verifyWebhookSignature } from './src';

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';

function printResult(name: string, success: boolean, details?: string): void {
  const status = success ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${status}] ${name}`);
  if (details) {
    console.log(`         ${details}`);
  }
}

async function validateCnam(vri: VeriRoute, phone: string): Promise<boolean> {
  console.log('\n=== CNAM Validation ===');

  try {
    // Basic CNAM
    const result = await vri.cnam(phone);

    printResult('Returns object with expected shape', typeof result === 'object');
    printResult("Has 'number' field", 'number' in result && result.number !== undefined);
    printResult("Has 'cnam' field", 'cnam' in result);

    console.log(`         Response: number=${result.number}, cnam=${result.cnam}`);

    // With spam
    const resultSpam = await vri.cnam(phone, { includeSpam: true });
    printResult('With includeSpam=true has spam_type', 'spamType' in resultSpam);
    console.log(`         spamType=${resultSpam.spamType}`);

    return true;
  } catch (e: any) {
    printResult('CNAM request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateLrn(vri: VeriRoute, phone: string): Promise<boolean> {
  console.log('\n=== LRN Validation ===');

  try {
    // Basic LRN
    const result = await vri.lrn(phone);

    printResult('Returns object with expected shape', typeof result === 'object');
    printResult("Has 'phoneNumber' field", 'phoneNumber' in result);
    printResult("Has 'lrn' field", 'lrn' in result);
    printResult("Has 'carrier' field", 'carrier' in result);
    printResult("Has 'lineType' field", 'lineType' in result);

    console.log(`         Response: lrn=${result.lrn}, carrier=${result.carrier}, lineType=${result.lineType}`);

    // With enhanced data
    const resultEnhanced = await vri.lrn(phone, { includeEnhanced: true });
    const hasEnhanced = resultEnhanced.enhanced !== null && resultEnhanced.enhanced !== undefined;
    printResult('With includeEnhanced=true returns enhanced data', hasEnhanced);

    if (hasEnhanced && resultEnhanced.enhanced) {
      const e = resultEnhanced.enhanced;
      printResult("Enhanced has 'city'", 'city' in e);
      printResult("Enhanced has 'state'", 'state' in e);
      printResult("Enhanced has 'timezone'", 'timezone' in e);
      console.log(`         Enhanced: city=${e.city}, state=${e.state}, timezone=${e.timezone}`);
    }

    // With messaging
    const resultMsg = await vri.lrn(phone, { messagingLookup: true });
    const hasMessaging = resultMsg.messaging !== null && resultMsg.messaging !== undefined;
    printResult('With messagingLookup=true returns messaging data', hasMessaging);

    if (hasMessaging && resultMsg.messaging) {
      const m = resultMsg.messaging;
      printResult("Messaging has 'provider'", 'provider' in m);
      printResult("Messaging has 'enabled'", 'enabled' in m);
      console.log(`         Messaging: provider=${m.provider}, enabled=${m.enabled}`);
    }

    return true;
  } catch (e: any) {
    printResult('LRN request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateTrust(vri: VeriRoute, phone: string): Promise<boolean> {
  console.log('\n=== Trust Validation ===');

  try {
    const result = await vri.trust(phone);

    printResult('Returns object with expected shape', typeof result === 'object');
    printResult("Has 'number' field", 'number' in result);
    printResult("Has 'isSpam' field", 'isSpam' in result);
    printResult("Has 'isRobocall' field", 'isRobocall' in result);
    printResult("Has 'isScam' field", 'isScam' in result);
    printResult("Has 'spamType' field", 'spamType' in result);
    printResult("Has 'complaintCount' field", 'complaintCount' in result);

    console.log(`         Response: isSpam=${result.isSpam}, spamType=${result.spamType}, complaints=${result.complaintCount}`);

    return true;
  } catch (e: any) {
    printResult('Trust request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateSpam(vri: VeriRoute, phone: string): Promise<boolean> {
  console.log('\n=== Spam Validation ===');

  try {
    const result = await vri.spam(phone);

    printResult('Returns object with expected shape', typeof result === 'object');
    printResult("Has 'phoneNumber' field", 'phoneNumber' in result);
    printResult("Has 'isSpam' field", 'isSpam' in result);
    printResult("Has 'spamType' field", 'spamType' in result);
    printResult("Has 'cached' field", 'cached' in result);
    printResult("Has 'source' field", 'source' in result);

    console.log(`         Response: isSpam=${result.isSpam}, spamType=${result.spamType}`);

    return true;
  } catch (e: any) {
    printResult('Spam request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateMessaging(vri: VeriRoute, phone: string): Promise<boolean> {
  console.log('\n=== Messaging Validation ===');

  try {
    const result = await vri.messaging(phone);

    printResult('Returns object with expected shape', typeof result === 'object');
    printResult("Has 'phoneNumber' field", 'phoneNumber' in result);
    printResult("Has 'messagingProvider' field", 'messagingProvider' in result);
    printResult("Has 'messagingEnabled' field", 'messagingEnabled' in result);
    printResult("Has 'messagingCountry' field", 'messagingCountry' in result);

    console.log(`         Response: provider=${result.messagingProvider}, enabled=${result.messagingEnabled}`);

    return true;
  } catch (e: any) {
    printResult('Messaging request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validatePricing(vri: VeriRoute): Promise<boolean> {
  console.log('\n=== Pricing Validation ===');

  try {
    const rates = await vri.pricing();
    printResult('pricing() returns object', typeof rates === 'object');
    printResult('Has at least one product', Object.keys(rates).length > 0);
    printResult('Prices are numbers', Object.values(rates).every((v) => typeof v === 'number'));
    console.log(`         Rates: ${JSON.stringify(rates)}`);
    return true;
  } catch (e: any) {
    printResult('pricing request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateStatus(vri: VeriRoute): Promise<boolean> {
  console.log('\n=== System Status Validation ===');

  try {
    const result = await vri.status();
    printResult("Has 'status' field", ['operational', 'degraded', 'outage'].includes(result.status));
    printResult("Has 'updatedAt' field", Boolean(result.updatedAt));
    printResult('Has components', result.components.length > 0);
    if (result.components.length > 0) {
      const c = result.components[0];
      printResult('Component has key/name/status', Boolean(c.key) && Boolean(c.name) && Boolean(c.status));
    }
    console.log(`         Status: ${result.status} (${result.components.length} components)`);
    return true;
  } catch (e: any) {
    printResult('status request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateKey(vri: VeriRoute): Promise<boolean> {
  console.log('\n=== API Key Validation ===');

  try {
    const isValid = await vri.validateKey();
    printResult('validateKey() returns boolean', typeof isValid === 'boolean');
    printResult('API key is valid', isValid);
    return isValid;
  } catch (e: any) {
    printResult('validateKey request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateErrorHandling(vri: VeriRoute): Promise<boolean> {
  console.log('\n=== Error Handling Validation ===');

  // Test invalid phone number
  try {
    await vri.cnam('invalid');
    printResult('Error raised for bad number', false);
  } catch (e: any) {
    const isCorrectError = e.code === 'INVALID_PHONE_NUMBER' || e.code === 'INTERNATIONAL_NOT_SUPPORTED';
    printResult('Error raised for bad number', isCorrectError, `code=${e.code}`);
  }

  // Test invalid API key
  try {
    const badVri = new VeriRoute('invalid_key_12345');
    await badVri.cnam('+15551234567');
    printResult('AuthenticationError raised for bad key', false);
  } catch (e: any) {
    const isAuthError = e.code === 'AUTH_FAILED' || e.code === 'AUTH_REQUIRED' || e.message?.includes('Invalid');
    printResult('AuthenticationError raised for bad key', isAuthError, `code=${e.code}`);
  }

  return true;
}

async function validateWebhookVerification(): Promise<boolean> {
  console.log('\n=== Webhook Signature Validation ===');

  const secret = 'test-secret';
  const body = '{"event":"job.completed","job":{"id":"abc"}}';
  const digest = createHmac('sha256', secret).update(body).digest('hex');

  let ok = true;
  let result = await verifyWebhookSignature(body, `sha256=${digest}`, secret);
  printResult('Valid signature accepted (sha256= prefix)', result);
  ok = ok && result;

  result = await verifyWebhookSignature(Buffer.from(body), digest, secret);
  printResult('Valid signature accepted (bytes body, bare hex)', result);
  ok = ok && result;

  result = !(await verifyWebhookSignature(body, `sha256=${digest}`, 'wrong-secret'));
  printResult('Wrong secret rejected', result);
  ok = ok && result;

  result = !(await verifyWebhookSignature(body + ' ', `sha256=${digest}`, secret));
  printResult('Tampered body rejected', result);
  ok = ok && result;

  result = !(await verifyWebhookSignature(body, '', secret));
  printResult('Empty signature rejected', result);
  ok = ok && result;

  return ok;
}

function validateVriAlias(): boolean {
  console.log('\n=== VRI Alias Validation ===');
  printResult('VRI is VeriRoute', VRI === VeriRoute);
  return VRI === VeriRoute;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: npx ts-node validate-sdk.ts <api_key> [phone_number]');
    console.log('Example: npx ts-node validate-sdk.ts vri_abc123 +15551234567');
    process.exit(1);
  }

  const apiKey = args[0];
  const phone = args[1] || '+12029001234'; // Default test number

  console.log('='.repeat(60));
  console.log('VeriRoute Intel TypeScript SDK Validation');
  console.log('='.repeat(60));
  console.log('API Base: https://api-service.verirouteintel.io');
  console.log(`Test Phone: ${phone}`);

  // Validate alias + webhook helper first (no API call needed)
  validateVriAlias();
  const webhookOk = await validateWebhookVerification();

  // Create client
  const vri = new VeriRoute(apiKey);

  // Validate API key first
  const keyValid = await validateKey(vri);
  if (!keyValid) {
    console.log(`\n${RED}API key validation failed. Check your key.${RESET}`);
    process.exit(1);
  }

  // Run all validations
  const results: [string, boolean][] = [];
  results.push(['CNAM', await validateCnam(vri, phone)]);
  results.push(['LRN', await validateLrn(vri, phone)]);
  results.push(['Trust', await validateTrust(vri, phone)]);
  results.push(['Spam', await validateSpam(vri, phone)]);
  results.push(['Messaging', await validateMessaging(vri, phone)]);
  results.push(['Pricing', await validatePricing(vri)]);
  results.push(['System Status', await validateStatus(vri)]);
  results.push(['Error Handling', await validateErrorHandling(vri)]);
  results.push(['Webhook Signature', webhookOk]);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(([, success]) => success).length;
  const total = results.length;

  for (const [name, success] of results) {
    const status = success ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`  ${name}: ${status}`);
  }

  console.log(`\nTotal: ${passed}/${total} passed`);

  if (passed === total) {
    console.log(`\n${GREEN}All validations passed!${RESET}`);
  } else {
    console.log(`\n${RED}Some validations failed. Review output above.${RESET}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Validation failed:', e);
  process.exit(1);
});
