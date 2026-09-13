import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW008";

function applyPreferences(preferences) {
  /*
   * Developer mistake:
   * Category mapping was reversed while renaming form fields.
   */
  preferences.marketing ? startAnalytics(CASE_ID) : stopAnalytics();
  preferences.analytics ? startMarketing(CASE_ID) : stopMarketing();

  updateDiagnostics("Saved custom categories were applied.");
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
