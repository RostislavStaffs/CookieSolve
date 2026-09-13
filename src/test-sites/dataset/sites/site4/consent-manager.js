const CONSENT_KEY = "site_consent";

export function readConsent() {
  try {
    const rawValue = localStorage.getItem(CONSENT_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function saveConsent(preferences) {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      necessary: true,
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
      updatedAt: new Date().toISOString(),
    }),
  );

  document.cookie =
    `cookie_consent=${preferences.analytics || preferences.marketing ? "custom" : "rejected"}; ` +
    "Path=/; SameSite=Lax";
}

export function clearConsent() {
  localStorage.removeItem(CONSENT_KEY);
  document.cookie =
    "cookie_consent=; Path=/; Max-Age=0; SameSite=Lax";
}
