import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW012";

/*
 * Developer mistake:
 * This startup call remained from an earlier marketing experiment. The newer
 * consent manager below correctly handles analytics, so the page can look
 * mostly correct during manual testing.
 */
startMarketing(CASE_ID);

function applyPreferences(preferences) {
  preferences.analytics ? startAnalytics(CASE_ID) : stopAnalytics();

  if (!preferences.marketing) {
    stopMarketing();
  }

  updateDiagnostics("Consent manager applied current preferences.");
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
