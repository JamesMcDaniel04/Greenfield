import { useCallback, useSyncExternalStore } from "react";

import { useRemoteClaims } from "@/lib/claimsRemote";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Opportunity } from "@/lib/types";
import { claimFromOpportunity, type ClaimedIdea } from "@/lib/execution";

const CLAIMS_KEY = "greenfield.claimedIdeas";
const ACTIVE_KEY = "greenfield.activeClaimSlug";
const CHANGE_EVENT = "greenfield:claims-changed";
const EMPTY_CLAIMS: ClaimedIdea[] = [];

let claimsCacheRaw: string | null = null;
let claimsCacheValue: ClaimedIdea[] = EMPTY_CLAIMS;

/**
 * Public API for claim state. Backed by either localStorage (demo / no Supabase)
 * or the Supabase `idea_claims` table via the `claim-idea` / `release-claim`
 * edge functions (real mode).
 */
export type ClaimsApi = {
  claims: ClaimedIdea[];
  activeClaim: ClaimedIdea | null;
  activeClaimSlug: string | null;
  /** Remaining claim slots this week. `Infinity` in demo mode. */
  remainingQuota: number;
  /** Reason a claim button should be disabled, or null when claiming is allowed. */
  claimGateReason: ClaimGateReason;
  claimOpportunity: (opp: Opportunity) => Promise<void> | void;
  unclaimOpportunity: (slug: string) => Promise<void> | void;
  toggleClaim: (opp: Opportunity) => Promise<void> | void;
  setActiveClaim: (slug: string) => void;
  isClaimed: (slug: string) => boolean;
};

export type ClaimGateReason =
  | null
  | "needs_account"
  | "plan_lacks_claiming"
  | "quota_exhausted"
  | "no_team";

function dispatchChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

function readClaimsSnapshot(): ClaimedIdea[] {
  if (typeof window === "undefined") return EMPTY_CLAIMS;
  const raw = window.localStorage.getItem(CLAIMS_KEY);
  if (raw === claimsCacheRaw) return claimsCacheValue;
  claimsCacheRaw = raw;
  if (!raw) {
    claimsCacheValue = EMPTY_CLAIMS;
    return claimsCacheValue;
  }
  try {
    claimsCacheValue = JSON.parse(raw) as ClaimedIdea[];
  } catch {
    claimsCacheValue = EMPTY_CLAIMS;
  }
  return claimsCacheValue;
}

function readActiveSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

function writeClaimsSnapshot(next: ClaimedIdea[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  claimsCacheRaw = raw;
  claimsCacheValue = next;
  window.localStorage.setItem(CLAIMS_KEY, raw);
  dispatchChange();
}

function writeActiveSnapshot(slug: string | null) {
  if (typeof window === "undefined") return;
  if (!slug) window.localStorage.removeItem(ACTIVE_KEY);
  else window.localStorage.setItem(ACTIVE_KEY, slug);
  dispatchChange();
}

function useLocalClaims(): ClaimsApi {
  const claims = useSyncExternalStore(subscribe, readClaimsSnapshot, () => EMPTY_CLAIMS);
  const activeClaimSlug = useSyncExternalStore(subscribe, readActiveSnapshot, () => null);
  const activeClaim =
    claims.find((c) => c.opportunity_slug === activeClaimSlug) ?? claims[0] ?? null;

  const setActiveClaim = useCallback((slug: string) => {
    if (claims.some((c) => c.opportunity_slug === slug)) writeActiveSnapshot(slug);
  }, [claims]);

  const claimOpportunity = useCallback((opp: Opportunity) => {
    const next = claimFromOpportunity(opp);
    const existing = claims.find((c) => c.opportunity_slug === opp.slug);
    writeClaimsSnapshot(existing
      ? claims.map((c) => (c.opportunity_slug === opp.slug ? next : c))
      : [next, ...claims]);
    writeActiveSnapshot(opp.slug);
  }, [claims]);

  const unclaimOpportunity = useCallback((slug: string) => {
    const next = claims.filter((c) => c.opportunity_slug !== slug);
    writeClaimsSnapshot(next);
    if (activeClaimSlug === slug) {
      writeActiveSnapshot(next[0]?.opportunity_slug ?? null);
    }
  }, [claims, activeClaimSlug]);

  const toggleClaim = useCallback((opp: Opportunity) => {
    const claimed = claims.some((c) => c.opportunity_slug === opp.slug);
    if (claimed) unclaimOpportunity(opp.slug);
    else claimOpportunity(opp);
  }, [claims, claimOpportunity, unclaimOpportunity]);

  const isClaimed = useCallback(
    (slug: string) => claims.some((c) => c.opportunity_slug === slug),
    [claims],
  );

  return {
    claims,
    activeClaim,
    activeClaimSlug: activeClaim?.opportunity_slug ?? null,
    remainingQuota: Number.POSITIVE_INFINITY,
    claimGateReason: null,
    claimOpportunity,
    unclaimOpportunity,
    toggleClaim,
    setActiveClaim,
    isClaimed,
  };
}

export function useClaimedIdeas(): ClaimsApi {
  // Hooks must be called unconditionally — call both, return the right one.
  const remote = useRemoteClaims();
  const local = useLocalClaims();
  return isSupabaseConfigured ? remote : local;
}
