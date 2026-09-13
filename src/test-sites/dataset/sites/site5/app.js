import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW005";

/*
 * Developer mistake:
 * The developer delayed analytics to reduce initial load time, assuming the
 * consent choice would be made before the timeout completed.
 */
const analyticsTimer = window.setTimeout(() => {
  startAnalytics(CASE_ID);
  updateDiagnostics("Delayed analytics startup completed.");
}, 2200);

const existingConsent = readConsent();
existingConsent ? hideBanner() : showBanner();

bindConsentUi({
  onAccept: async () => {
    startAnalytics(CASE_ID);
  },

  onReject: async () => {
    clearTimeout(analyticsTimer);
    stopAnalytics();
    updateDiagnostics("Delayed startup cancelled after rejection.");
  },

  onSavePreferences: async (preferences) => {
    if (preferences.analytics) {
      startAnalytics(CASE_ID);
    } else {
      clearTimeout(analyticsTimer);
      stopAnalytics();
    }
  },
});
