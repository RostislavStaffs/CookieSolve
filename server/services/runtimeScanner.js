import {
  chromium,
  firefox,
  webkit,
} from "playwright";

function getBrowserLauncher(browserName) {
  const launchers = {
    chromium,
    firefox,
    webkit,
  };

  return launchers[browserName] ?? chromium;
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function getRegistrableComparisonHost(
  hostname,
) {
  return String(hostname)
    .replace(/^www\./i, "")
    .toLowerCase();
}

function isThirdPartyRequest(
  requestUrl,
  targetUrl,
) {
  const requestHostname =
    getRegistrableComparisonHost(
      getHostname(requestUrl),
    );

  const targetHostname =
    getRegistrableComparisonHost(
      getHostname(targetUrl),
    );

  if (!requestHostname || !targetHostname) {
    return false;
  }

  return requestHostname !== targetHostname;
}

function sanitiseCookies(cookies) {
  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  }));
}

async function captureBrowserStorage(page) {
  return page.evaluate(() => {
    const results = [];

    for (
      let index = 0;
      index < localStorage.length;
      index += 1
    ) {
      const key = localStorage.key(index);

      if (key === null) {
        continue;
      }

      results.push({
        origin: window.location.origin,
        key,
        value:
          localStorage.getItem(key) ?? "",
        storageType: "localStorage",
      });
    }

    for (
      let index = 0;
      index < sessionStorage.length;
      index += 1
    ) {
      const key = sessionStorage.key(index);

      if (key === null) {
        continue;
      }

      results.push({
        origin: window.location.origin,
        key,
        value:
          sessionStorage.getItem(key) ?? "",
        storageType: "sessionStorage",
      });
    }

    return results;
  });
}

async function capturePhaseSnapshot({
  context,
  page,
  networkRequests,
}) {
  const cookies = await context.cookies();

  const browserStorage =
    await captureBrowserStorage(page);

  return {
    cookies: sanitiseCookies(cookies),
    networkRequests: [...networkRequests],
    browserStorage,
  };
}

export async function runRuntimeScan({
  targetUrl,
  rejectSelector,
  browser = "chromium",
  waitTime = 1500,
  onStepChange = async () => {},
}) {
  const browserLauncher =
    getBrowserLauncher(browser);

  let browserInstance;

  try {
    await onStepChange(
      "Launching browser",
    );

    browserInstance =
      await browserLauncher.launch({
        headless: true,
      });

    const context =
      await browserInstance.newContext({
        ignoreHTTPSErrors: true,
      });

    const page = await context.newPage();

    let activePhase = "pre-consent";

    const preConsentRequests = [];
    const postRejectionRequests = [];

    page.on("request", (request) => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        hostname: getHostname(request.url()),
        isThirdParty:
          isThirdPartyRequest(
            request.url(),
            targetUrl,
          ),
        timestamp: new Date(),
      };

      if (
        activePhase === "pre-consent"
      ) {
        preConsentRequests.push(
          requestData,
        );

        return;
      }

      postRejectionRequests.push(
        requestData,
      );
    });

    await onStepChange(
      "Loading target website",
    );

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await onStepChange(
      "Waiting for pre-consent activity",
    );

    await page.waitForTimeout(waitTime);

    await onStepChange(
      "Capturing pre-consent evidence",
    );

    const preConsent =
      await capturePhaseSnapshot({
        context,
        page,
        networkRequests:
          preConsentRequests,
      });

    await onStepChange(
      "Locating rejection control",
    );

    const rejectControl =
      page.locator(rejectSelector).first();

    await rejectControl.waitFor({
      state: "visible",
      timeout: 10000,
    });

    /*
     * Requests triggered by the rejection
     * action belong to the post-rejection phase.
     */
    activePhase = "post-rejection";

    await onStepChange(
      "Rejecting consent",
    );

    await rejectControl.click({
      timeout: 10000,
    });

    await onStepChange(
      "Waiting for post-rejection activity",
    );

    await page.waitForTimeout(waitTime);

    await onStepChange(
      "Capturing post-rejection evidence",
    );

    const postRejection =
      await capturePhaseSnapshot({
        context,
        page,
        networkRequests:
          postRejectionRequests,
      });

    await context.close();

    return {
      preConsent,
      postRejection,
    };
  } finally {
    if (browserInstance) {
      await browserInstance.close();
    }
  }
}