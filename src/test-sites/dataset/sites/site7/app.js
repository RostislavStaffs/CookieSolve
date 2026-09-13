import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing, stopMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW007";

function applyPreferences(preferences) {
  preferences.analytics ? startAnalytics(CASE_ID) : stopAnalytics();
  preferences.marketing ? startMarketing(CASE_ID) : stopMarketing();

  updateDiagnostics(
    `Applied categories: analytics=${preferences.analytics}, marketing=${preferences.marketing}`,
  );
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
