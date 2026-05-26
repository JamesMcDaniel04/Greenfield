/**
 * Developer-only escape hatch for the payment gateway. Set by the
 * /masteroreo911 page after a successful login with the developer email.
 * The Layout gate reads this flag to skip the pricing redirect.
 *
 * Also exports a short-lived "just paid" grace flag so a user returning
 * from Stripe Checkout can reach /browse before the webhook flips
 * profile.is_pro server-side.
 */

export const DEV_LOGIN_EMAIL = "hello@joinfloor.app";

const BYPASS_KEY = "greenfield:dev_bypass";
const POST_CHECKOUT_KEY = "greenfield:post_checkout_until";
const POST_CHECKOUT_GRACE_MS = 5 * 60 * 1000;

export function isDevBypassEnabled(): boolean {
  try {
    return localStorage.getItem(BYPASS_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableDevBypass(): void {
  try {
    localStorage.setItem(BYPASS_KEY, "1");
  } catch {
    /* storage disabled — bypass simply won't persist */
  }
}

export function clearDevBypass(): void {
  try {
    localStorage.removeItem(BYPASS_KEY);
  } catch {
    /* noop */
  }
}

export function markPostCheckoutGrace(): void {
  try {
    localStorage.setItem(POST_CHECKOUT_KEY, String(Date.now() + POST_CHECKOUT_GRACE_MS));
  } catch {
    /* noop */
  }
}

export function isPostCheckoutGraceActive(): boolean {
  try {
    const raw = localStorage.getItem(POST_CHECKOUT_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    if (Date.now() < until) return true;
    localStorage.removeItem(POST_CHECKOUT_KEY);
    return false;
  } catch {
    return false;
  }
}
