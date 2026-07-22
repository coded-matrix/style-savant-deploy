// Persistence for the in-progress Studio outfit ("draft"). The draft lives in
// localStorage so a user who navigates away mid-outfit is invited back to the
// Studio and returns with their slots, photo, and last try-on intact.
//
// The draft is cleared when the look is saved, added to cart, manually reset,
// or when it is older than 24 hours.

export type SlotKey = "Top" | "Bottom" | "Shoes" | "Accessory" | "Outerwear";

export interface SelectedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Cloth-only image for AI try-on, when available. */
  clothImage?: string;
}

export interface StudioDraft {
  slots: Record<SlotKey, SelectedItem | null>;
  activeSlot: SlotKey;
  photo: string | null;
  tryOnImage: string | null;
  savedAt: number;
}

export const STUDIO_DRAFT_KEY = "ss-studio-draft";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Fired whenever the draft is written or cleared, so same-tab listeners
 *  (e.g. the "Continue your outfit" nav guard) can react immediately. */
export const STUDIO_DRAFT_EVENT = "ss-studio-draft-change";

const isBrowser = typeof window !== "undefined";

export function hasStudioItems(draft: StudioDraft | null): boolean {
  if (!draft) return false;
  return Object.values(draft.slots).some((s) => s !== null);
}

export function loadStudioDraft(): StudioDraft | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(STUDIO_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as StudioDraft;
    if (!draft || typeof draft.savedAt !== "number") return null;
    // Expire drafts older than 24 hours.
    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      clearStudioDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveStudioDraft(draft: Omit<StudioDraft, "savedAt">): void {
  if (!isBrowser) return;
  try {
    const payload: StudioDraft = { ...draft, savedAt: Date.now() };
    localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(STUDIO_DRAFT_EVENT));
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearStudioDraft(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STUDIO_DRAFT_KEY);
    window.dispatchEvent(new Event(STUDIO_DRAFT_EVENT));
  } catch {
    // ignore
  }
}
