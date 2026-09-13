import { readConsent } from "./consent-manager.js";
import { bindConsentUi, hideBanner, showBanner, updateDiagnostics } from "./ui.js";

const CASE_ID = "FW009";

async function sendUsageEvent() {
  document.cookie =
    `fp_analytics_id=${CASE_ID}.${Date.now()}; Path=/; SameSite=Lax`;

  localStorage.setItem(
    "first_party_analytics_user",
    `${CASE_ID}-${crypto.randomUUID()}`,
  );

  await fetch(
    `http://127.0.0.1:3200/events?case=${CASE_ID}`,
    {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view" }),
    },
  );
}

/*
 * Developer mistake:
 * The request was considered "first party" by the team and excluded from the
 * consent gate, even though it carries analytics identifiers.
 */
sendUsageEvent();

const existingConsent = readConsent();
existingConsent ? hideBanner() : showBanner();

bindConsentUi({
  onAccept: async () => updateDiagnostics("Acceptance saved."),
  onReject: async () => updateDiagnostics("Rejection saved."),
  onSavePreferences: async () => updateDiagnostics("Preferences saved."),
});
