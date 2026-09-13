import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW002";

/*
 * Developer mistake:
 * Analytics was initialised during application startup while the banner work
 * was being added later. The banner looks correct, but it does not prevent
 * the initial analytics page view.
 */
startAnalytics(CASE_ID);

function applyPreferences(preferences) {
  if (!preferences.analytics) {
    stopAnalytics();
  }

  if (preferences.marketing) {
    startMarketing(CASE_ID);
  } else {
    stopMarketing();
  }

  updateDiagnostics("Consent choice applied after initial application startup.");
}

const existingConsent = readConsent();
existingConsent ? hideBanner() : showBanner();

bindConsentUi({
  onAccept: applyPreferences,
  onReject: applyPreferences,
  onSavePreferences: applyPreferences,
});
