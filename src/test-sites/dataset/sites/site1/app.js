import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW001";

function applyPreferences(preferences) {
  if (preferences.analytics) {
    startAnalytics(CASE_ID);
  } else {
    stopAnalytics();
  }

  if (preferences.marketing) {
    startMarketing(CASE_ID);
  } else {
    stopMarketing();
  }

  updateDiagnostics(
    `Preferences applied: analytics=${preferences.analytics}, marketing=${preferences.marketing}`,
  );
}

const existingConsent = readConsent();

if (existingConsent) {
  hideBanner();
  applyPreferences(existingConsent);
} else {
  showBanner();
  updateDiagnostics("No prior consent. Optional services remain disabled.");
}

bindConsentUi({
  onAccept: applyPreferences,
  onReject: applyPreferences,
  onSavePreferences: applyPreferences,
});
