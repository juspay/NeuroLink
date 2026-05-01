import crypto from "crypto";

/**
 * Constant-time bearer-token comparison.
 *
 * Bug 2 mitigation: a normal `===` compare on bearer tokens leaks the token
 * length and the position of the first mismatching byte through timing
 * differences, which is reachable when the voice server is bound publicly
 * (`VOICE_SERVER_ALLOW_PUBLIC=1`).
 *
 * Returns `false` for any comparison whose lengths differ — this avoids the
 * `RangeError` that `crypto.timingSafeEqual` throws on mismatched buffers
 * while still preserving the constant-time property for equal-length inputs
 * (which is the only case an attacker can probe).
 */
export function timingSafeEqualString(
  provided: string,
  expected: string,
): boolean {
  const providedBuf = Buffer.from(provided, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}
