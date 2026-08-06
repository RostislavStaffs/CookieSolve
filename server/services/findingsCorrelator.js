const VENDOR_INDICATORS = {
  "google-analytics": [
    "google-analytics",
    "google analytics",
    "analytics.js",
    "ga.js",
    "_ga",
    "g-tag",
  ],

  gtag: [
    "gtag",
    "g-tag",
    "g/collect",
    "google-analytics",
  ],

  "google-tag-manager": [
    "googletagmanager",
    "google tag manager",
    "gtm-",
    "gtm.js",
    "datalayer",
  ],

  meta: [
    "facebook",
    "facebook.com",
    "connect.facebook",
    "meta pixel",
    "fbq",
    "fbevents",
    "_fbp",
  ],

  hotjar: [
    "hotjar",
    "hj(",
    "_hj",
    "static.hotjar",
  ],

  clarity: [
    "clarity",
    "clarity.ms",
    "_clck",
    "_clsk",
  ],

  segment: [
    "segment",
    "segment.com",
    "analytics.track",
    "analytics.identify",
  ],

  mixpanel: [
    "mixpanel",
    "mxpnl",
    "mixpanel.com",
  ],

  amplitude: [
    "amplitude",
    "amplitude.com",
    "amplitude.getinstance",
  ],

  doubleclick: [
    "doubleclick",
    "doubleclick.net",
    "ide",
  ],

  beacon: [
    "sendbeacon",
    "navigator.sendbeacon",
    "beacon",
  ],
};

const GENERIC_IGNORED_WORDS =
  new Set([
    "http",
    "https",
    "www",
    "com",
    "net",
    "org",
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "before",
    "after",
    "consent",
    "user",
    "request",
    "created",
    "detected",
    "potential",
    "tracking",
    "analytics",
    "source",
    "code",
    "script",
    "storage",
    "cookie",
    "local",
    "session",
    "high",
    "medium",
    "low",
  ]);

function normalise(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function flattenEvidence(evidence) {
  if (!evidence) {
    return "";
  }

  if (
    typeof evidence ===
    "string"
  ) {
    return evidence;
  }

  if (
    Array.isArray(evidence)
  ) {
    return evidence
      .map(flattenEvidence)
      .join(" ");
  }

  if (
    typeof evidence ===
    "object"
  ) {
    return Object.values(
      evidence,
    )
      .map(flattenEvidence)
      .join(" ");
  }

  return String(evidence);
}

function createFindingText(
  finding,
) {
  return normalise(
    [
      finding?.type,
      finding?.title,
      finding?.description,
      flattenEvidence(
        finding?.evidence,
      ),
    ].join(" "),
  );
}

function extractTokens(text) {
  return new Set(
    normalise(text)
      .split(
        /[^a-z0-9_.:/-]+/i,
      )
      .map((token) =>
        token.trim(),
      )
      .filter(
        (token) =>
          token.length >= 4 &&
          !GENERIC_IGNORED_WORDS.has(
            token,
          ),
      ),
  );
}

function detectVendors(text) {
  const vendors = [];

  for (
    const [
      vendor,
      indicators,
    ] of Object.entries(
      VENDOR_INDICATORS,
    )
  ) {
    const matched =
      indicators.some(
        (indicator) =>
          text.includes(
            indicator,
          ),
      );

    if (matched) {
      vendors.push(vendor);
    }
  }

  return vendors;
}

function getSharedValues(
  firstValues,
  secondValues,
) {
  const secondSet =
    new Set(secondValues);

  return [
    ...new Set(firstValues),
  ].filter((value) =>
    secondSet.has(value),
  );
}

function getExactEvidenceMatches({
  runtimeFinding,
  sourceFinding,
}) {
  const runtimeEvidence =
    runtimeFinding?.evidence ??
    {};

  const sourceText =
    createFindingText(
      sourceFinding,
    );

  const possibleValues = [
    runtimeEvidence.name,
    runtimeEvidence.key,
    runtimeEvidence.hostname,
    runtimeEvidence.domain,
  ]
    .map(normalise)
    .filter(
      (value) =>
        value.length >= 3,
    );

  return possibleValues.filter(
    (value) =>
      sourceText.includes(
        value,
      ),
  );
}

function calculateCorrelation({
  runtimeFinding,
  sourceFinding,
}) {
  const runtimeText =
    createFindingText(
      runtimeFinding,
    );

  const sourceText =
    createFindingText(
      sourceFinding,
    );

  const runtimeVendors =
    detectVendors(
      runtimeText,
    );

  const sourceVendors =
    detectVendors(
      sourceText,
    );

  const sharedVendors =
    getSharedValues(
      runtimeVendors,
      sourceVendors,
    );

  const runtimeTokens =
    extractTokens(
      runtimeText,
    );

  const sourceTokens =
    extractTokens(
      sourceText,
    );

  const sharedTokens =
    getSharedValues(
      [...runtimeTokens],
      [...sourceTokens],
    ).slice(0, 8);

  const exactEvidenceMatches =
    getExactEvidenceMatches({
      runtimeFinding,
      sourceFinding,
    });

  let score = 0;

  score +=
    sharedVendors.length *
    5;

  score +=
    exactEvidenceMatches
      .length * 4;

  score +=
    Math.min(
      sharedTokens.length,
      5,
    );

  /*
   * Category compatibility is
   * supporting evidence only.
   * It must not create a strong
   * correlation by itself.
   */
  if (
    runtimeFinding.category ===
      "cookie" &&
    [
      "DIRECT_COOKIE_ASSIGNMENT",
      "TRACKER_SCRIPT_TAG",
      "GTAG_INITIALISATION",
      "META_PIXEL_INITIALISATION",
    ].includes(
      sourceFinding.type,
    )
  ) {
    score += 1;
  }

  if (
    runtimeFinding.category ===
      "browser-storage" &&
    [
      "LOCAL_STORAGE_WRITE",
      "SESSION_STORAGE_WRITE",
    ].includes(
      sourceFinding.type,
    )
  ) {
    score += 1;
  }

  if (
    runtimeFinding.category ===
      "network" &&
    [
      "TRACKING_FETCH_REQUEST",
      "TRACKER_SCRIPT_TAG",
      "GTAG_INITIALISATION",
      "GOOGLE_TAG_MANAGER_INITIALISATION",
      "META_PIXEL_INITIALISATION",
      "HOTJAR_INITIALISATION",
      "DYNAMIC_EXTERNAL_SCRIPT",
    ].includes(
      sourceFinding.type,
    )
  ) {
    score += 1;
  }

  let confidence = null;

  /*
   * High confidence now requires
   * an exact runtime identifier,
   * such as a cookie name,
   * storage key, hostname or
   * domain appearing in the
   * source evidence.
   */
  if (
    score >= 12 &&
    exactEvidenceMatches
      .length > 0
  ) {
    confidence = "high";
  } else if (
    score >= 8 &&
    (
      exactEvidenceMatches
        .length > 0 ||
      sharedVendors.length > 0
    )
  ) {
    confidence = "medium";
  } else if (
    score >= 6 &&
    exactEvidenceMatches
      .length > 0
  ) {
    confidence = "low";
  }

  const matchedIndicators = [
    ...sharedVendors,
    ...exactEvidenceMatches,
    ...sharedTokens,
  ]
    .filter(Boolean)
    .filter(
      (
        value,
        index,
        values,
      ) =>
        values.indexOf(
          value,
        ) === index,
    )
    .slice(0, 10);

  return {
    score,
    confidence,
    matchedIndicators,
  };
}

function createExplanation({
  runtimeFinding,
  sourceFinding,
  confidence,
  matchedIndicators,
}) {
  const sourceFile =
    sourceFinding
      ?.evidence?.file ??
    "the identified source file";

  const sourceLine =
    sourceFinding
      ?.evidence?.line;

  const location =
    sourceLine
      ? `${sourceFile}, line ${sourceLine}`
      : sourceFile;

  const indicatorsText =
    matchedIndicators.length >
    0
      ? matchedIndicators.join(
          ", ",
        )
      : "related tracking behaviour";

  return (
    `This ${confidence}-confidence correlation links ` +
    `"${runtimeFinding.title}" with "${sourceFinding.title}" ` +
    `in ${location}. Shared indicators: ${indicatorsText}.`
  );
}

export function correlateFindings(
  findings = [],
) {
  const safeFindings =
    Array.isArray(findings)
      ? findings
      : [];

  const runtimeFindings =
    safeFindings
      .map(
        (
          finding,
          index,
        ) => ({
          finding,
          index,
        }),
      )
      .filter(
        ({ finding }) =>
          [
            "cookie",
            "network",
            "browser-storage",
          ].includes(
            finding?.category,
          ),
      );

  const sourceFindings =
    safeFindings
      .map(
        (
          finding,
          index,
        ) => ({
          finding,
          index,
        }),
      )
      .filter(
        ({ finding }) =>
          finding?.category ===
          "source-code",
      );

  const correlations = [];

  for (
    const runtimeItem of
    runtimeFindings
  ) {
    for (
      const sourceItem of
      sourceFindings
    ) {
      const result =
        calculateCorrelation({
          runtimeFinding:
            runtimeItem.finding,

          sourceFinding:
            sourceItem.finding,
        });

      if (
        !result.confidence
      ) {
        continue;
      }

      correlations.push({
        runtimeFindingIndex:
          runtimeItem.index,

        sourceFindingIndex:
          sourceItem.index,

        runtimeFindingType:
          runtimeItem.finding
            .type,

        sourceFindingType:
          sourceItem.finding
            .type,

        runtimeTitle:
          runtimeItem.finding
            .title,

        sourceTitle:
          sourceItem.finding
            .title,

        sourceFile:
          sourceItem.finding
            ?.evidence?.file ??
          "",

        sourceLine:
          Number(
            sourceItem.finding
              ?.evidence?.line,
          ) || null,

        confidence:
          result.confidence,

        score:
          result.score,

        matchedIndicators:
          result
            .matchedIndicators,

        explanation:
          createExplanation({
            runtimeFinding:
              runtimeItem.finding,

            sourceFinding:
              sourceItem.finding,

            confidence:
              result.confidence,

            matchedIndicators:
              result
                .matchedIndicators,
          }),
      });
    }
  }

  /*
   * Keep the strongest result
   * for each runtime/source
   * finding pair.
   */
  const uniqueCorrelations =
    new Map();

  for (
    const correlation of
    correlations
  ) {
    const identifier = [
      correlation
        .runtimeFindingIndex,

      correlation
        .sourceFindingIndex,
    ].join("|");

    const existing =
      uniqueCorrelations.get(
        identifier,
      );

    if (
      !existing ||
      correlation.score >
        existing.score
    ) {
      uniqueCorrelations.set(
        identifier,
        correlation,
      );
    }
  }

  return [
    ...uniqueCorrelations.values(),
  ].sort(
    (
      firstCorrelation,
      secondCorrelation,
    ) =>
      secondCorrelation.score -
      firstCorrelation.score,
  );
}