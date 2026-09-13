let analyticsStarted = false;

export function startAnalytics(caseId) {
  if (analyticsStarted) {
    return;
  }

  analyticsStarted = true;

  document.cookie =
    `_ga=${caseId}.${Date.now()}; Path=/; SameSite=Lax`;

  localStorage.setItem(
    "analytics_client_id",
    `${caseId}-${crypto.randomUUID()}`,
  );

  fetch(
    `http://127.0.0.1:3200/analytics/collect?case=${encodeURIComponent(caseId)}&event=page_view`,
    { mode: "no-cors" },
  );
}

export function stopAnalytics() {
  analyticsStarted = false;

  document.cookie =
    "_ga=; Path=/; Max-Age=0; SameSite=Lax";

  localStorage.removeItem(
    "analytics_client_id",
  );
}
