import { readConsent } from "./consent-manager.js";
import { startAnalytics } from "./analytics.js";
import { startMarketing } from "./marketing.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW003";
let servicesStarted = false;

function startOptionalServices() {
  if (servicesStarted) return;
  servicesStarted = true;
  startAnalytics(CASE_ID);
  startMarketing(CASE_ID);
}

const existingConsent = readConsent();

if (existingConsent) {
  hideBanner();

  /*
   * Developer mistake:
   * The team used the existence of any stored consent object as the signal
   * to load optional services. A saved rejection is therefore treated like
   * an acceptance on the next page load.
   */
  startOptionalServices();
} else {
  showBanner();
}

bindConsentUi({
  onAccept: async () => {
    startOptionalServices();
    updateDiagnostics("Optional services enabled after acceptance.");
  },

  onReject: async () => {
    /*
     * Developer mistake:
     * The shared UI module hides the banner and stores rejection, but this
     * handler does not stop services that may already be running.
     */
    updateDiagnostics("Rejection saved and banner hidden.");
  },

  onSavePreferences: async (preferences) => {
    if (preferences.analytics || preferences.marketing) {
      startOptionalServices();
    }
  },
});
