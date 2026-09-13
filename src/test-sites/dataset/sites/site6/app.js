import { readConsent } from "./consent-manager.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const existingConsent = readConsent();

if (existingConsent) {
  hideBanner();
  updateDiagnostics("Saved privacy choice restored. No optional services exist.");
} else {
  showBanner();
}

bindConsentUi({
  onAccept: async () => {
    updateDiagnostics("Preference saved. No optional services configured.");
  },
  onReject: async () => {
    updateDiagnostics("Preference saved. No optional services configured.");
  },
  onSavePreferences: async () => {
    updateDiagnostics("Preferences saved. No optional services configured.");
  },
});
