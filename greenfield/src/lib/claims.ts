import { useSyncExternalStore } from "react";

import type { Opportunity } from "@/lib/types";
import { claimFromOpportunity, type ClaimedIdea } from "@/lib/execution";

const CLAIMS_KEY = "greenfield.claimedIdeas";
const ACTIVE_KEY = "greenfield.activeClaimSlug";
const CHANGE_EVENT = "greenfield:claims-changed";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

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
  return readJson<ClaimedIdea[]>(CLAIMS_KEY, []);
}

function readActiveSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

function writeClaimsSnapshot(next: ClaimedIdea[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(next));
  dispatchChange();
}

function writeActiveSnapshot(slug: string | null) {
  if (typeof window === "undefined") return;
  if (!slug) window.localStorage.removeItem(ACTIVE_KEY);
  else window.localStorage.setItem(ACTIVE_KEY, slug);
  dispatchChange();
}

export function useClaimedIdeas() {
  const claims = useSyncExternalStore(subscribe, readClaimsSnapshot, () => []);
  const activeClaimSlug = useSyncExternalStore(subscribe, readActiveSnapshot, () => null);
  const activeClaim = claims.find((claim) => claim.opportunity_slug === activeClaimSlug) ?? claims[0] ?? null;

  function setActiveClaim(slug: string) {
    const exists = claims.some((claim) => claim.opportunity_slug === slug);
    if (!exists) return;
    writeActiveSnapshot(slug);
  }

  function claimOpportunity(opportunity: Opportunity) {
    const nextClaim = claimFromOpportunity(opportunity);
    const existing = claims.find((claim) => claim.opportunity_slug === opportunity.slug);
    const next = existing
      ? claims.map((claim) => (claim.opportunity_slug === opportunity.slug ? nextClaim : claim))
      : [nextClaim, ...claims];
    writeClaimsSnapshot(next);
    writeActiveSnapshot(opportunity.slug);
  }

  function unclaimOpportunity(slug: string) {
    const next = claims.filter((claim) => claim.opportunity_slug !== slug);
    writeClaimsSnapshot(next);
    if (activeClaimSlug === slug) {
      writeActiveSnapshot(next[0]?.opportunity_slug ?? null);
    }
  }

  function toggleClaim(opportunity: Opportunity) {
    const claimed = claims.some((claim) => claim.opportunity_slug === opportunity.slug);
    if (claimed) unclaimOpportunity(opportunity.slug);
    else claimOpportunity(opportunity);
  }

  function isClaimed(slug: string) {
    return claims.some((claim) => claim.opportunity_slug === slug);
  }

  return {
    claims,
    activeClaim,
    activeClaimSlug: activeClaim?.opportunity_slug ?? null,
    claimOpportunity,
    unclaimOpportunity,
    toggleClaim,
    setActiveClaim,
    isClaimed,
  };
}
