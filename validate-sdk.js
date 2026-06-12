#!/usr/bin/env node
/**
 * SDK Validation Script
 *
 * Tests the TypeScript SDK against the live API to verify response structures match.
 * Run with: node validate-sdk.js <api_key> [phone_number]
 */

const { VeriRoute, VRI } = require('./dist/index.js');

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const RESET = '\x1b[0m';

function printResult(name, success, details) {
  const status = success ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${status}] ${name}`);
  if (details) {
    console.log(`         ${details}`);
  }
}

async function validateCnam(vri, phone) {
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
    printResult('With includeSpam=true has spamType', 'spamType' in resultSpam);
    console.log(`         spamType=${resultSpam.spamType}`);

    return true;
  } catch (e) {
    printResult('CNAM request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateLrn(vri, phone) {
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

    // LRN only mode
    const resultLrnOnly = await vri.lrn(phone, { lrnOnly: true });
    printResult('lrnOnly mode works', 'lrn' in resultLrnOnly);
    console.log(`         lrnOnly Response: lrn=${resultLrnOnly.lrn}`);

    return true;
  } catch (e) {
    printResult('LRN request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateTrust(vri, phone) {
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
  } catch (e) {
    printResult('Trust request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateSpam(vri, phone) {
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
  } catch (e) {
    printResult('Spam request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateMessaging(vri, phone) {
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
  } catch (e) {
    printResult('Messaging request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateKey(vri) {
  console.log('\n=== API Key Validation ===');

  // Skip connectivity test for now - it was for debugging

  try {
    const isValid = await vri.validateKey();
    printResult('validateKey() returns boolean', typeof isValid === 'boolean');
    printResult('API key is valid', isValid);
    return isValid;
  } catch (e) {
    console.log(`         DEBUG: Error type: ${e.constructor.name}`);
    console.log(`         DEBUG: Error code: ${e.code}`);
    console.log(`         DEBUG: Error message: ${e.message}`);
    if (e.cause) console.log(`         DEBUG: Cause: ${e.cause}`);
    printResult('validateKey request', false, `Error: ${e.message}`);
    return false;
  }
}

async function validateErrorHandling(vri) {
  console.log('\n=== Error Handling Validation ===');

  // Test invalid phone number
  try {
    await vri.cnam('invalid');
    printResult('Error raised for bad number', false);
  } catch (e) {
    const isCorrectError = e.code === 'INVALID_PHONE_NUMBER' || e.code === 'INTERNATIONAL_NOT_SUPPORTED';
    printResult('Error raised for bad number', isCorrectError, `code=${e.code}`);
  }

  // Test invalid API key
  try {
    const badVri = new VeriRoute('invalid_key_12345');
    await badVri.cnam('+15551234567');
    printResult('AuthenticationError raised for bad key', false);
  } catch (e) {
    const isAuthError = e.code === 'AUTH_FAILED' || e.code === 'AUTH_REQUIRED' || (e.message && e.message.includes('Invalid'));
    printResult('AuthenticationError raised for bad key', isAuthError, `code=${e.code}`);
  }

  return true;
}

function validateVriAlias() {
  console.log('\n=== VRI Alias Validation ===');
  printResult('VRI is VeriRoute', VRI === VeriRoute);
  return VRI === VeriRoute;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node validate-sdk.js <api_key> [phone_number] [base_url]');
    console.log('Example: node validate-sdk.js vri_abc123 +15551234567');
    console.log('Example: node validate-sdk.js vri_abc123 +15551234567 http://localhost:5000');
    process.exit(1);
  }

  const apiKey = args[0];
  const phone = args[1] || '+12029001234'; // Default test number
  const baseUrl = args[2] || null;

  console.log('='.repeat(60));
  console.log('VeriRoute Intel TypeScript SDK Validation');
  console.log('='.repeat(60));
  console.log(`API Base: ${baseUrl || 'https://api-service.verirouteintel.io'}`);
  console.log(`Test Phone: ${phone}`);

  // Validate alias first (no API call needed)
  validateVriAlias();

  // Create client
  const vri = baseUrl
    ? new VeriRoute({ apiKey, baseUrl })
    : new VeriRoute(apiKey);

  // Validate API key first
  const keyValid = await validateKey(vri);
  if (!keyValid) {
    console.log(`\n${RED}API key validation failed. Check your key.${RESET}`);
    process.exit(1);
  }

  // Run all validations
  const results = [];
  results.push(['CNAM', await validateCnam(vri, phone)]);
  results.push(['LRN', await validateLrn(vri, phone)]);
  results.push(['Trust', await validateTrust(vri, phone)]);
  results.push(['Spam', await validateSpam(vri, phone)]);
  results.push(['Messaging', await validateMessaging(vri, phone)]);
  results.push(['Error Handling', await validateErrorHandling(vri)]);

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
