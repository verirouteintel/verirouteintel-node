/**
 * Webhook signature verification for job-completion webhooks.
 *
 * Uses WebCrypto (globalThis.crypto.subtle), available in Node 18+, Deno,
 * Bun, and browsers - the same runtimes that provide the fetch API this SDK
 * already relies on.
 */

const SIGNATURE_PREFIX = 'sha256=';
const HEX_64 = /^[0-9a-f]{64}$/i;

/**
 * Verify the HMAC-SHA256 signature on a job-completion webhook.
 *
 * When a job is submitted with a webhookSecret, VeriRoute Intel signs the
 * webhook body with HMAC-SHA256 and sends the hex digest in the
 * X-Webhook-Signature header as 'sha256=<hex>'. Verify against the RAW
 * request body exactly as received - re-serializing the parsed JSON will
 * produce a different byte sequence and the check will fail.
 *
 * @param payload - Raw request body (bytes as received, or the exact string)
 * @param signature - Value of the X-Webhook-Signature header
 * @param secret - The webhookSecret supplied at job submission
 * @returns true if the signature is valid (compared timing-safely)
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from 'verirouteintel';
 *
 * // In your webhook handler (Express shown - use a raw body parser,
 * // e.g. express.raw({ type: 'application/json' }), NOT express.json()):
 * app.post('/hooks/vri', express.raw({ type: 'application/json' }), async (req, res) => {
 *   const signature = req.header('X-Webhook-Signature') ?? '';
 *   const valid = await verifyWebhookSignature(req.body, signature, 'your-shared-secret');
 *   if (!valid) return res.status(401).end();
 *
 *   const event = JSON.parse(req.body.toString('utf8'));
 *   console.log(event.job.id, event.job.status);
 *   res.status(204).end();
 * });
 * ```
 */
export async function verifyWebhookSignature(
  payload: string | Uint8Array,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  const hex = signature.startsWith(SIGNATURE_PREFIX)
    ? signature.slice(SIGNATURE_PREFIX.length)
    : signature;
  if (!HEX_64.test(hex)) {
    return false;
  }

  const signatureBytes = new Uint8Array(64 / 2);
  for (let i = 0; i < signatureBytes.length; i++) {
    signatureBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const encoder = new TextEncoder();
  // Copy into a fresh Uint8Array so the bytes are plain-ArrayBuffer-backed
  // (BufferSource rejects SharedArrayBuffer-backed views).
  const body = typeof payload === 'string' ? encoder.encode(payload) : new Uint8Array(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // crypto.subtle.verify performs a timing-safe comparison internally.
  return crypto.subtle.verify('HMAC', key, signatureBytes, body);
}
