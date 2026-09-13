import {
  clearConsent,
  readConsent,
  saveConsent,
} from "./consent-manager.js";

const banner = document.querySelector("#cookie-banner");
const preferencesBackdrop = document.querySelector("#preferences-backdrop");
const analyticsPreference = document.querySelector("#analytics-preference");
const marketingPreference = document.querySelector("#marketing-preference");
const diagnostics = document.querySelector("#diagnostics");

export function updateDiagnostics(message) {
  diagnostics.textContent =
    `${new Date().toLocaleTimeString()} — ${message}`;
}

export function showBanner() {
  banner.hidden = false;
}

export function hideBanner() {
  banner.hidden = true;
}

export function bindConsentUi({
  onAccept,
  onReject,
  onSavePreferences,
}) {
  document.querySelector("#accept-all").addEventListener("click", async () => {
    const preferences = { analytics: true, marketing: true };
    saveConsent(preferences);
    hideBanner();
    await onAccept(preferences);
  });

  document.querySelector("#reject-all").addEventListener("click", async () => {
    const preferences = { analytics: false, marketing: false };
    saveConsent(preferences);
    hideBanner();
    await onReject(preferences);
  });

  document.querySelector("#manage-preferences").addEventListener("click", () => {
    const existingConsent = readConsent();
    analyticsPreference.checked = Boolean(existingConsent?.analytics);
    marketingPreference.checked = Boolean(existingConsent?.marketing);
    preferencesBackdrop.hidden = false;
  });

  document.querySelector("#close-preferences").addEventListener("click", () => {
    preferencesBackdrop.hidden = true;
  });

  document.querySelector("#save-preferences").addEventListener("click", async () => {
    const preferences = {
      analytics: analyticsPreference.checked,
      marketing: marketingPreference.checked,
    };

    saveConsent(preferences);
    preferencesBackdrop.hidden = true;
    hideBanner();
    await onSavePreferences(preferences);
  });

  document.querySelector("#reset-consent").addEventListener("click", () => {
    clearConsent();
    location.reload();
  });
}
