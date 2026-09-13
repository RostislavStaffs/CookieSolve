import { readConsent } from "./consent-manager.js";
import { startAnalytics, stopAnalytics } from "./analytics.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW011";
const storedConsent = readConsent();

/*
 * Developer mistake:
 * This fallback was introduced so analytics remained enabled for legacy users.
 * New visitors with no consent record are also treated as opted in.
 */
const analyticsAllowed =
  storedConsent?.analytics ?? true;

if (analyticsAllowed) {
  startAnalytics(CASE_ID);
}

if (storedConsent) {
  hideBanner();
} else {
  showBanner();
}

bindConsentUi({
  onAccept: async () => {
    startAnalytics(CASE_ID);
    updateDiagnostics("Analytics enabled.");
  },
  onReject: async () => {
    stopAnalytics();
    updateDiagnostics("Analytics disabled after rejection.");
  },
  onSavePreferences: async (preferences) => {
    preferences.analytics ? startAnalytics(CASE_ID) : stopAnalytics();
  },
});
