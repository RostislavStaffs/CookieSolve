import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { startMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW004";

function enableAll() {
  startAnalytics(CASE_ID);
  startMarketing(CASE_ID);
}

const existingConsent = readConsent();

if (existingConsent?.analytics || existingConsent?.marketing) {
  hideBanner();
  enableAll();
} else if (existingConsent) {
  hideBanner();
} else {
  showBanner();
}

bindConsentUi({
  onAccept: async () => {
    enableAll();
    updateDiagnostics("Analytics and marketing enabled.");
  },

  onReject: async () => {
    /*
     * Developer mistake:
     * The analytics cleanup was implemented, but the marketing pixel cleanup
     * was missed during a refactor.
     */
    stopAnalytics();
    updateDiagnostics("Analytics stopped after rejection.");
  },

  onSavePreferences: async (preferences) => {
    if (preferences.analytics) startAnalytics(CASE_ID);
    if (preferences.marketing) startMarketing(CASE_ID);
  },
});
