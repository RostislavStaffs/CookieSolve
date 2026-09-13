import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW010";

function applyPreferences(preferences) {
  preferences.analytics ? startAnalytics(CASE_ID) : stopAnalytics();
  preferences.marketing ? startMarketing(CASE_ID) : stopMarketing();

  updateDiagnostics("Preference state and optional services synchronised.");
}

const existingConsent = readConsent();

if (existingConsent) {
  hideBanner();
  applyPreferences(existingConsent);
} else {
  showBanner();
}

bindConsentUi({
  onAccept: applyPreferences,
  onReject: applyPreferences,
  onSavePreferences: applyPreferences,
});
