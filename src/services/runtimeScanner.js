import { chromium, firefox, webkit } from "playwright";

const browserLaunchers = {
  chromium,
  firefox,
  webkit,
};

function getHostname(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function getRegistrableComparisonHost(hostname) {
  const parts = hostname.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(-2).join(".");
}

function isThirdPartyRequest(requestUrl, targetUrl) {
  const requestHostname = getHostname(requestUrl);
  const targetHostname = getHostname(targetUrl);

  if (!requestHostname || !targetHostname) {
    return false;
  }

  return (
    getRegistrableComparisonHost(requestHostname) !==
    getRegistrableComparisonHost(targetHostname)
  );
}

async function collectBrowserStorage(page) {
  return page.evaluate(() => {
    const entries = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      entries.push({
        origin: window.location.origin,
        key,
        value: localStorage.getItem(key),
        storageType: "localStorage",
      });
    }

    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);

      entries.push({
        origin: window.location.origin,
        key,
        value: sessionStorage.getItem(key),
        storageType: "sessionStorage",
      });
    }

    return entries;
  });
}

function copyRequests(requests) {
  return requests.map((request) => ({
    ...request,
  }));
}

async function capturePhase({
  context,
  page,
  observedRequests,
}) {
  const cookies = await context.cookies();
  const browserStorage = await collectBrowserStorage(page);

  return {
    cookies,
    browserStorage,
    networkRequests: copyRequests(observedRequests),
  };
}

export async function runRuntimeScan({
  targetUrl,
  rejectSelector,
  browserName = "chromium",
  waitTime = 3000,
  onProgress = async () => {},
}) {
  const launcher = browserLaunchers[browserName];

  if (!launcher) {
    throw new Error(`Unsupported browser: ${browserName}`);
  }

  let browser;

  try {
    await onProgress("Launching browser");

    browser = await launcher.launch({
      headless: true,
    });

    // A fresh context prevents data from another scan affecting the result.
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    const observedRequests = [];

    page.on("request", (request) => {
      const requestUrl = request.url();

      observedRequests.push({
        url: requestUrl,
        method: request.method(),
        resourceType: request.resourceType(),
        hostname: getHostname(requestUrl),
        isThirdParty: isThirdPartyRequest(
          requestUrl,
          targetUrl,
        ),
        timestamp: new Date(),
      });
    });

    await onProgress("Loading target website");

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(1000);

    await onProgress("Capturing pre-consent behaviour");

    const preConsent = await capturePhase({
      context,
      page,
      observedRequests,
    });

    // Only requests made after rejection should be included in this phase.
    observedRequests.length = 0;

    await onProgress("Applying reject action");

    const rejectButton = page.locator(rejectSelector).first();

    await rejectButton.waitFor({
      state: "visible",
      timeout: 10000,
    });

    await rejectButton.click();

    await onProgress("Waiting for post-rejection activity");

    await page.waitForTimeout(waitTime);

    await onProgress("Capturing post-rejection behaviour");

    const postRejection = await capturePhase({
      context,
      page,
      observedRequests,
    });

    return {
      preConsent,
      postRejection,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}