let marketingStarted = false;

export function startMarketing(caseId) {
  if (marketingStarted) {
    return;
  }

  marketingStarted = true;

  document.cookie =
    `_fbp=${caseId}.${Date.now()}; Path=/; SameSite=Lax`;

  const pixel = new Image();
  pixel.src =
    `http://127.0.0.1:3200/marketing/pixel?case=${encodeURIComponent(caseId)}&event=page_view`;

  document.body.appendChild(pixel);
}

export function stopMarketing() {
  marketingStarted = false;

  document.cookie =
    "_fbp=; Path=/; Max-Age=0; SameSite=Lax";
}
