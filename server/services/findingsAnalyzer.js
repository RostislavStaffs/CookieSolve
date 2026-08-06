const DEFAULT_CONSENT_STORAGE_KEYS = [
  "consent_choice",
  "cookie_consent",
  "cookieconsent",
  "cookie_consent_status",
  "consent_status",
  "user_consent",
];

const SUSPICIOUS_REQUEST_KEYWORDS = [
  "analytics",
  "tracking",
  "tracker",
  "telemetry",
  "collect",
  "pixel",
  "beacon",
  "advert",
  "marketing",
  "measure",
  "metrics",
  "gtag",
  "google-analytics",
  "googletagmanager",
  "facebook",
  "doubleclick",
  "segment",
  "hotjar",
  "clarity",
  "mixpanel",
  "amplitude",
];

const IGNORED_RESOURCE_TYPES =
  new Set([
    "document",
    "stylesheet",
    "font",
    "image",
    "media",
  ]);

function normalise(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function createCookieIdentifier(
  cookie,
) {
  return [
    normalise(cookie.name),
    normalise(cookie.domain),
    normalise(cookie.path || "/"),
  ].join("|");
}

function createStorageIdentifier(
  item,
) {
  return [
    normalise(item.origin),
    normalise(item.storageType),
    normalise(item.key),
  ].join("|");
}

function isConsentStorageKey(key) {
  const normalisedKey =
    normalise(key);

  return DEFAULT_CONSENT_STORAGE_KEYS.some(
    (consentKey) =>
      normalisedKey ===
        consentKey ||
      normalisedKey.includes(
        consentKey,
      ),
  );
}

function isAllowlistedCookie(
  cookie,
  allowlist = [],
) {
  const cookieName =
    normalise(cookie.name);

  return allowlist.some(
    (allowedName) =>
      normalise(
        allowedName,
      ) === cookieName,
  );
}

function requestContainsSuspiciousKeyword(
  request,
) {
  const url =
    normalise(request.url);

  return SUSPICIOUS_REQUEST_KEYWORDS.some(
    (keyword) =>
      url.includes(keyword),
  );
}

function isSuspiciousRequest(
  request,
) {
  if (request.isThirdParty) {
    return true;
  }

  if (
    requestContainsSuspiciousKeyword(
      request,
    )
  ) {
    return true;
  }

  const resourceType =
    normalise(
      request.resourceType,
    );

  if (
    !IGNORED_RESOURCE_TYPES.has(
      resourceType,
    ) &&
    [
      "fetch",
      "xhr",
      "websocket",
      "eventsource",
      "ping",
    ].includes(resourceType)
  ) {
    return requestContainsSuspiciousKeyword(
      request,
    );
  }

  return false;
}

function createFinding({
  category,
  phase,
  type,
  severity,
  title,
  description,
  evidence,
}) {
  return {
    category,
    phase,
    type,
    severity,
    title,
    description,
    evidence,
  };
}

function analysePreConsentCookies({
  preConsentCookies,
  necessaryCookieAllowlist,
}) {
  return preConsentCookies
    .filter(
      (cookie) =>
        !isAllowlistedCookie(
          cookie,
          necessaryCookieAllowlist,
        ),
    )
    .map((cookie) =>
      createFinding({
        category: "cookie",
        phase: "pre-consent",
        type:
          "cookie-before-consent",
        severity: "high",
        title:
          "Cookie created before consent",
        description:
          `The cookie "${cookie.name}" was present before ` +
          "the user made a consent choice.",
        evidence: {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires,
          httpOnly:
            cookie.httpOnly,
          secure: cookie.secure,
          sameSite:
            cookie.sameSite,
        },
      }),
    );
}

function analysePostRejectionCookies({
  preConsentCookies,
  postRejectionCookies,
  necessaryCookieAllowlist,
}) {
  const findings = [];

  const preConsentCookieMap =
    new Map(
      preConsentCookies.map(
        (cookie) => [
          createCookieIdentifier(
            cookie,
          ),
          cookie,
        ],
      ),
    );

  for (
    const cookie of
    postRejectionCookies
  ) {
    if (
      isAllowlistedCookie(
        cookie,
        necessaryCookieAllowlist,
      )
    ) {
      continue;
    }

    const identifier =
      createCookieIdentifier(
        cookie,
      );

    const existingCookie =
      preConsentCookieMap.get(
        identifier,
      );

    if (existingCookie) {
      findings.push(
        createFinding({
          category: "cookie",
          phase:
            "post-rejection",
          type:
            "cookie-persisted-after-rejection",
          severity: "high",
          title:
            "Cookie persisted after rejection",
          description:
            `The cookie "${cookie.name}" existed before consent ` +
            "and remained present after the user rejected consent.",
          evidence: {
            name: cookie.name,
            value: cookie.value,
            previousValue:
              existingCookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expires:
              cookie.expires,
            httpOnly:
              cookie.httpOnly,
            secure: cookie.secure,
            sameSite:
              cookie.sameSite,
          },
        }),
      );

      continue;
    }

    findings.push(
      createFinding({
        category: "cookie",
        phase:
          "post-rejection",
        type:
          "cookie-created-after-rejection",
        severity: "high",
        title:
          "Cookie created after rejection",
        description:
          `The cookie "${cookie.name}" was newly created after ` +
          "the user rejected consent.",
        evidence: {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires,
          httpOnly:
            cookie.httpOnly,
          secure: cookie.secure,
          sameSite:
            cookie.sameSite,
        },
      }),
    );
  }

  return findings;
}

function analysePreConsentStorage(
  preConsentStorage,
) {
  return preConsentStorage
    .filter(
      (item) =>
        !isConsentStorageKey(
          item.key,
        ),
    )
    .map((item) =>
      createFinding({
        category:
          "browser-storage",
        phase: "pre-consent",
        type:
          "storage-before-consent",
        severity: "medium",
        title:
          "Browser storage created before consent",
        description:
          `The ${item.storageType} entry "${item.key}" ` +
          "was present before a consent choice was made.",
        evidence: {
          origin: item.origin,
          key: item.key,
          value: item.value,
          storageType:
            item.storageType,
        },
      }),
    );
}

function analysePostRejectionStorage({
  preConsentStorage,
  postRejectionStorage,
}) {
  const findings = [];

  const preConsentStorageMap =
    new Map(
      preConsentStorage.map(
        (item) => [
          createStorageIdentifier(
            item,
          ),
          item,
        ],
      ),
    );

  for (
    const item of
    postRejectionStorage
  ) {
    if (
      isConsentStorageKey(
        item.key,
      )
    ) {
      continue;
    }

    const identifier =
      createStorageIdentifier(
        item,
      );

    const existingItem =
      preConsentStorageMap.get(
        identifier,
      );

    if (existingItem) {
      findings.push(
        createFinding({
          category:
            "browser-storage",
          phase:
            "post-rejection",
          type:
            "storage-persisted-after-rejection",
          severity: "medium",
          title:
            "Browser storage persisted after rejection",
          description:
            `The ${item.storageType} entry "${item.key}" ` +
            "existed before consent and remained after rejection.",
          evidence: {
            origin: item.origin,
            key: item.key,
            value: item.value,
            previousValue:
              existingItem.value,
            storageType:
              item.storageType,
          },
        }),
      );

      continue;
    }

    findings.push(
      createFinding({
        category:
          "browser-storage",
        phase:
          "post-rejection",
        type:
          "storage-created-after-rejection",
        severity: "medium",
        title:
          "Browser storage created after rejection",
        description:
          `The ${item.storageType} entry "${item.key}" ` +
          "was newly created after the user rejected consent.",
        evidence: {
          origin: item.origin,
          key: item.key,
          value: item.value,
          storageType:
            item.storageType,
        },
      }),
    );
  }

  return findings;
}

function analyseRequests({
  requests,
  phase,
}) {
  return requests
    .filter(
      isSuspiciousRequest,
    )
    .map((request) => {
      const beforeConsent =
        phase ===
        "pre-consent";

      return createFinding({
        category: "network",
        phase,
        type: beforeConsent
          ? "suspicious-request-before-consent"
          : "suspicious-request-after-rejection",
        severity:
          request.isThirdParty
            ? "high"
            : "medium",
        title: beforeConsent
          ? "Suspicious request sent before consent"
          : "Suspicious request sent after rejection",
        description: beforeConsent
          ? `A potentially tracking-related request was sent to ` +
            `"${request.url}" before the user made a choice.`
          : `A potentially tracking-related request was sent to ` +
            `"${request.url}" after the user rejected consent.`,
        evidence: {
          url: request.url,
          method: request.method,
          resourceType:
            request.resourceType,
          hostname:
            request.hostname,
          isThirdParty:
            request.isThirdParty,
          timestamp:
            request.timestamp,
        },
      });
    });
}

export function buildFindingsSummary(
  findings = [],
) {
  const safeFindings =
    Array.isArray(findings)
      ? findings
      : [];

  const summary = {
    total:
      safeFindings.length,

    high: 0,
    medium: 0,
    low: 0,

    cookies: 0,
    network: 0,
    browserStorage: 0,
    sourceCode: 0,

    preConsent: 0,
    postRejection: 0,
    postAcceptance: 0,
  };

  for (
    const finding of
    safeFindings
  ) {
    if (
      [
        "high",
        "medium",
        "low",
      ].includes(
        finding.severity,
      )
    ) {
      summary[
        finding.severity
      ] += 1;
    }

    if (
      finding.category ===
      "cookie"
    ) {
      summary.cookies += 1;
    }

    if (
      finding.category ===
      "network"
    ) {
      summary.network += 1;
    }

    if (
      finding.category ===
      "browser-storage"
    ) {
      summary.browserStorage += 1;
    }

    if (
      finding.category ===
      "source-code"
    ) {
      summary.sourceCode += 1;
    }

    if (
      finding.phase ===
      "pre-consent"
    ) {
      summary.preConsent += 1;
    }

    if (
      finding.phase ===
      "post-rejection"
    ) {
      summary.postRejection += 1;
    }

    if (
      finding.phase ===
      "post-acceptance"
    ) {
      summary.postAcceptance += 1;
    }
  }

  return summary;
}

export function analyseRuntimeFindings({
  preConsent,
  postAction,
  consentAction = "reject",
  necessaryCookieAllowlist = [],
  scanOptions = {},
}) {
  const resolvedScanOptions = {
    cookies:
      scanOptions.cookies !== false,

    networkRequests:
      scanOptions
        .networkRequests !== false,

    browserStorage:
      scanOptions
        .browserStorage !== false,

    sourceCode:
      scanOptions.sourceCode ===
      true,
  };

  const safePreConsent = {
    cookies:
      preConsent?.cookies ?? [],

    networkRequests:
      preConsent
        ?.networkRequests ?? [],

    browserStorage:
      preConsent
        ?.browserStorage ?? [],
  };

  const safePostAction = {
    cookies:
      postAction?.cookies ?? [],

    networkRequests:
      postAction
        ?.networkRequests ?? [],

    browserStorage:
      postAction
        ?.browserStorage ?? [],
  };

  const findings = [];

  if (
    resolvedScanOptions.cookies
  ) {
    findings.push(
      ...analysePreConsentCookies({
        preConsentCookies:
          safePreConsent.cookies,

        necessaryCookieAllowlist,
      }),
    );
  }

  if (
    resolvedScanOptions
      .browserStorage
  ) {
    findings.push(
      ...analysePreConsentStorage(
        safePreConsent
          .browserStorage,
      ),
    );
  }

  if (
    resolvedScanOptions
      .networkRequests
  ) {
    findings.push(
      ...analyseRequests({
        requests:
          safePreConsent
            .networkRequests,

        phase:
          "pre-consent",
      }),
    );
  }

  /*
   * Post-action data is classified as a
   * violation only for Reject All scans.
   */
  if (
    consentAction === "reject"
  ) {
    if (
      resolvedScanOptions.cookies
    ) {
      findings.push(
        ...analysePostRejectionCookies({
          preConsentCookies:
            safePreConsent.cookies,

          postRejectionCookies:
            safePostAction.cookies,

          necessaryCookieAllowlist,
        }),
      );
    }

    if (
      resolvedScanOptions
        .browserStorage
    ) {
      findings.push(
        ...analysePostRejectionStorage({
          preConsentStorage:
            safePreConsent
              .browserStorage,

          postRejectionStorage:
            safePostAction
              .browserStorage,
        }),
      );
    }

    if (
      resolvedScanOptions
        .networkRequests
    ) {
      findings.push(
        ...analyseRequests({
          requests:
            safePostAction
              .networkRequests,

          phase:
            "post-rejection",
        }),
      );
    }
  }

  return {
    findings,
    summary:
      buildFindingsSummary(
        findings,
      ),
  };
}