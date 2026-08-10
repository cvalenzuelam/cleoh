export const NEWSLETTER_STORAGE_KEY = "cleoh-newsletter";
const DISMISS_DAYS = 7;

export type NewsletterStorageState =
  | { subscribed: true; email?: string }
  | { dismissedUntil: number };

export function readNewsletterStorage(): NewsletterStorageState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NewsletterStorageState;
  } catch {
    return null;
  }
}

export function isNewsletterSubscribed() {
  const stored = readNewsletterStorage();
  return Boolean(stored && "subscribed" in stored && stored.subscribed);
}

export function getNewsletterEmail() {
  const stored = readNewsletterStorage();
  if (!stored || !("subscribed" in stored) || !stored.subscribed) return "";
  return typeof stored.email === "string" ? stored.email : "";
}

export function markNewsletterSubscribed(email?: string) {
  const normalized = email?.trim().toLowerCase() || undefined;
  const previous = getNewsletterEmail();
  localStorage.setItem(
    NEWSLETTER_STORAGE_KEY,
    JSON.stringify({
      subscribed: true,
      ...(normalized || previous ? { email: normalized || previous } : {}),
    }),
  );
}

export function markNewsletterDismissed() {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(
    NEWSLETTER_STORAGE_KEY,
    JSON.stringify({ dismissedUntil }),
  );
}

export function shouldShowNewsletterPopup(pathname: string) {
  const SKIP_PATH_PREFIXES = ["/checkout", "/carrito"];
  if (
    SKIP_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return false;
  }

  const stored = readNewsletterStorage();
  if (stored && "subscribed" in stored && stored.subscribed) return false;
  if (
    stored &&
    "dismissedUntil" in stored &&
    stored.dismissedUntil > Date.now()
  ) {
    return false;
  }

  return true;
}
