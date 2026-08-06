import {
  access,
  readFile,
  readdir,
  stat,
} from "node:fs/promises";

import path from "node:path";

const SUPPORTED_EXTENSIONS =
  new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".htm",
  ]);

const IGNORED_DIRECTORIES =
  new Set([
    "node_modules",
    "dist",
    "build",
    ".git",
    ".next",
    ".vite",
    "coverage",
    "public",
  ]);

const MAX_FILE_SIZE_BYTES =
  1024 * 1024;

const MAX_FILES_PER_SCAN =
  500;

const CONSENT_STATE_IDENTIFIERS =
  new Set([
    "consent",
    "consent_choice",
    "consent_preferences",
    "consent_status",
    "cookie_consent",
    "cookie_consent_status",
    "cookie_preferences",
    "cookieconsent",
    "site_consent",
    "user_consent",
  ]);

const CONSENT_FILE_INDICATORS = [
  "consent",
  "cookie-manager",
  "cookie_manager",
  "cookie-preferences",
  "cookie_preferences",
  "privacy-preferences",
  "privacy_preferences",
];

const TRACKING_IDENTIFIER_PATTERNS = [
  /\b_ga\b/i,
  /\b_gid\b/i,
  /\b_gat\b/i,
  /\b_fbp\b/i,
  /\b_fbc\b/i,
  /\b_clck\b/i,
  /\b_clsk\b/i,
  /\b_hj[a-z0-9_]*\b/i,

  /\banalytics[_-]?(client|user|visitor|session)?[_-]?id\b/i,

  /\bmarketing[_-]?(client|user|visitor|session)?[_-]?id\b/i,

  /\btracking[_-]?(client|user|visitor|session)?[_-]?id\b/i,

  /\badvertising[_-]?(client|user|visitor|session)?[_-]?id\b/i,

  /\btelemetry[_-]?(client|user|visitor|session)?[_-]?id\b/i,
];

const CONSENT_CONDITION_PATTERNS = [
  /\bconsent\b/i,
  /\bpreferences?\b/i,
  /\bpermission\b/i,
  /\ballowed\b/i,
  /\baccepted\b/i,
  /\bopted[_-]?in\b/i,

  /\banalytics\s*===?\s*true\b/i,
  /\bmarketing\s*===?\s*true\b/i,
  /\badvertising\s*===?\s*true\b/i,
  /\bperformance\s*===?\s*true\b/i,

  /\bpreferences?\s*\.\s*analytics\b/i,
  /\bpreferences?\s*\.\s*marketing\b/i,
  /\bpreferences?\s*\.\s*advertising\b/i,
  /\bpreferences?\s*\.\s*performance\b/i,

  /\bconsent\s*\.\s*analytics\b/i,
  /\bconsent\s*\.\s*marketing\b/i,
  /\bconsent\s*\.\s*advertising\b/i,

  /\bhasAnalyticsConsent\b/i,
  /\bhasMarketingConsent\b/i,
  /\bisAnalyticsAllowed\b/i,
  /\bisMarketingAllowed\b/i,
];

const CLEANUP_FUNCTION_PATTERNS = [
  /^stop/i,
  /^remove/i,
  /^clear/i,
  /^delete/i,
  /^disable/i,
  /^cleanup/i,
  /^reset/i,
  /^revoke/i,
];

const SOURCE_RULES = [
  {
    ruleId:
      "TRACKER_SCRIPT_TAG",

    defaultSeverity:
      "high",

    title:
      "Tracking script may load without consent gating",

    description:
      "A known tracking or analytics script appears in the source code.",

    guidance:
      "Load the tracking script only after the relevant consent category has been granted.",

    patterns: [
      /googletagmanager\.com\/gtag\/js/i,

      /googletagmanager\.com\/gtm\.js/i,

      /google-analytics\.com\/analytics\.js/i,

      /connect\.facebook\.net\/.*fbevents\.js/i,

      /static\.hotjar\.com/i,

      /cdn\.segment\.com\/analytics/i,

      /cdn\.mxpnl\.com/i,

      /clarity\.ms\/tag/i,
    ],
  },

  {
    ruleId:
      "GTAG_INITIALISATION",

    defaultSeverity:
      "high",

    title:
      "Google Analytics initialisation detected",

    description:
      "A Google Analytics configuration or event call was found.",

    guidance:
      "Run Google Analytics initialisation only after analytics consent has been granted.",

    patterns: [
      /\bgtag\s*\(\s*["']config["']/i,

      /\bgtag\s*\(\s*["']event["']/i,
    ],
  },

  {
    ruleId:
      "GOOGLE_TAG_MANAGER_INITIALISATION",

    defaultSeverity:
      "high",

    title:
      "Google Tag Manager initialisation detected",

    description:
      "Google Tag Manager initialisation code was found.",

    guidance:
      "Do not initialise Tag Manager until the relevant consent category has been accepted.",

    patterns: [
      /\bdataLayer\b.*\bgtm\.start\b/i,

      /\bGTM-[A-Z0-9]+\b/i,
    ],
  },

  {
    ruleId:
      "META_PIXEL_INITIALISATION",

    defaultSeverity:
      "high",

    title:
      "Meta Pixel initialisation detected",

    description:
      "Meta Pixel initialisation or event tracking code was found.",

    guidance:
      "Call Meta Pixel functions only after marketing consent has been granted.",

    patterns: [
      /\bfbq\s*\(\s*["']init["']/i,

      /\bfbq\s*\(\s*["']track["']/i,
    ],
  },

  {
    ruleId:
      "HOTJAR_INITIALISATION",

    defaultSeverity:
      "high",

    title:
      "Hotjar initialisation detected",

    description:
      "Hotjar tracking code was found.",

    guidance:
      "Initialise Hotjar only after analytics or performance consent has been granted.",

    patterns: [
      /\bhj\s*\(\s*["']trigger["']/i,

      /\bhj\s*\(\s*["']identify["']/i,

      /\bhj\s*=\s*window\.hj/i,
    ],
  },

  {
    ruleId:
      "DIRECT_COOKIE_ASSIGNMENT",

    defaultSeverity:
      "medium",

    title:
      "Potential non-essential cookie assignment",

    description:
      "The source code writes directly to document.cookie.",

    guidance:
      "Place non-essential cookie creation behind an explicit consent condition.",

    patterns: [
      /\bdocument\.cookie\s*=/i,
    ],
  },

  {
    ruleId:
      "LOCAL_STORAGE_WRITE",

    defaultSeverity:
      "medium",

    title:
      "Potential non-essential localStorage write",

    description:
      "The source code writes data to localStorage.",

    guidance:
      "Avoid storing analytics or advertising identifiers until the relevant consent has been granted.",

    patterns: [
      /\blocalStorage\.setItem\s*\(/i,

      /\bwindow\.localStorage\.setItem\s*\(/i,
    ],
  },

  {
    ruleId:
      "SESSION_STORAGE_WRITE",

    defaultSeverity:
      "low",

    title:
      "Potential non-essential sessionStorage write",

    description:
      "The source code writes data to sessionStorage.",

    guidance:
      "Ensure non-essential browser-storage writes occur only after valid consent.",

    patterns: [
      /\bsessionStorage\.setItem\s*\(/i,

      /\bwindow\.sessionStorage\.setItem\s*\(/i,
    ],
  },

  {
    ruleId:
      "DYNAMIC_EXTERNAL_SCRIPT",

    defaultSeverity:
      "medium",

    title:
      "Dynamic external script injection detected",

    description:
      "The source code dynamically creates or assigns an external script source.",

    guidance:
      "Ensure the script injection function is called only after the required consent category has been accepted.",

    patterns: [
      /createElement\s*\(\s*["']script["']\s*\)/i,

      /\.src\s*=\s*["']https?:\/\//i,

      /setAttribute\s*\(\s*["']src["']\s*,\s*["']https?:\/\//i,
    ],
  },

  {
    ruleId:
      "TRACKING_FETCH_REQUEST",

    defaultSeverity:
      "medium",

    title:
      "Potential tracking request detected",

    description:
      "A network request appears to target an analytics, tracking or collection endpoint.",

    guidance:
      "Send tracking requests only after the user has granted the relevant consent.",

    patterns: [
      /\bfetch\s*\([^)]*(analytics|tracking|collect|telemetry|pixel|beacon)/i,

      /\bXMLHttpRequest\b.*(analytics|tracking|collect|telemetry|pixel|beacon)/i,

      /\bnavigator\.sendBeacon\s*\(/i,
    ],
  },
];

function normalise(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalisePathSeparators(
  filePath,
) {
  return filePath
    .split(path.sep)
    .join("/");
}

function getConfiguredSourceRoot() {
  const configuredRoot =
    process.env
      .SCAN_SOURCE_ROOT;

  if (!configuredRoot) {
    throw new Error(
      "SCAN_SOURCE_ROOT is not configured in the server environment.",
    );
  }

  const cleanedRoot =
    String(configuredRoot)
      .trim()
      .replace(
        /^["']|["']$/g,
        "",
      );

  const expandedRoot =
    cleanedRoot === "~"
      ? process.env.HOME
      : cleanedRoot.startsWith(
            "~/",
          )
        ? path.join(
            process.env.HOME ??
              "",
            cleanedRoot.slice(
              2,
            ),
          )
        : cleanedRoot;

  return path.resolve(
    expandedRoot,
  );
}

function resolveSafeSourceFolder(
  requestedFolder,
) {
  const sourceRoot =
    getConfiguredSourceRoot();

  const cleanedFolder =
    String(
      requestedFolder ?? "",
    ).trim();

  if (!cleanedFolder) {
    throw new Error(
      "A source-code folder is required when source-code scanning is enabled.",
    );
  }

  const resolvedFolder =
    path.resolve(
      sourceRoot,
      cleanedFolder,
    );

  const relativePath =
    path.relative(
      sourceRoot,
      resolvedFolder,
    );

  const escapesSourceRoot =
    relativePath.startsWith(
      "..",
    ) ||
    path.isAbsolute(
      relativePath,
    );

  if (escapesSourceRoot) {
    throw new Error(
      "The requested source folder is outside the permitted source-code root.",
    );
  }

  return {
    sourceRoot,
    resolvedFolder,
  };
}

function shouldIgnoreDirectory(
  directoryName,
) {
  return IGNORED_DIRECTORIES.has(
    directoryName
      .toLowerCase(),
  );
}

function isSupportedFile(
  filePath,
) {
  return SUPPORTED_EXTENSIONS.has(
    path
      .extname(filePath)
      .toLowerCase(),
  );
}

async function collectSourceFiles(
  directoryPath,
  collectedFiles = [],
) {
  if (
    collectedFiles.length >=
    MAX_FILES_PER_SCAN
  ) {
    return collectedFiles;
  }

  const entries =
    await readdir(
      directoryPath,
      {
        withFileTypes: true,
      },
    );

  for (
    const entry of entries
  ) {
    if (
      collectedFiles.length >=
      MAX_FILES_PER_SCAN
    ) {
      break;
    }

    const entryPath =
      path.join(
        directoryPath,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      if (
        shouldIgnoreDirectory(
          entry.name,
        )
      ) {
        continue;
      }

      await collectSourceFiles(
        entryPath,
        collectedFiles,
      );

      continue;
    }

    if (
      entry.isFile() &&
      isSupportedFile(
        entryPath,
      )
    ) {
      collectedFiles.push(
        entryPath,
      );
    }
  }

  return collectedFiles;
}

function countCharacter(
  source,
  character,
) {
  return [
    ...String(source),
  ].filter(
    (item) =>
      item === character,
  ).length;
}

function getBraceDifference(
  source,
) {
  return (
    countCharacter(
      source,
      "{",
    ) -
    countCharacter(
      source,
      "}",
    )
  );
}

function removeInlineComment(
  source,
) {
  return String(source)
    .replace(
      /\/\/.*$/,
      "",
    )
    .trim();
}

function getEvidenceSnippet({
  lines,
  lineIndex,
  before = 2,
  after = 3,
}) {
  const startIndex =
    Math.max(
      0,
      lineIndex - before,
    );

  const endIndex =
    Math.min(
      lines.length,
      lineIndex + after,
    );

  return lines
    .slice(
      startIndex,
      endIndex,
    )
    .map(
      (
        line,
        snippetIndex,
      ) => {
        const lineNumber =
          startIndex +
          snippetIndex +
          1;

        return (
          `${lineNumber}: ` +
          line
        );
      },
    )
    .join("\n");
}

function isConsentFile(
  relativeFilePath,
) {
  const normalisedPath =
    normalise(
      relativeFilePath,
    );

  return CONSENT_FILE_INDICATORS.some(
    (indicator) =>
      normalisedPath.includes(
        indicator,
      ),
  );
}

function isConsentIdentifier(
  value,
) {
  const normalisedValue =
    normalise(value)
      .replace(
        /[^a-z0-9_-]/g,
        "",
      );

  if (!normalisedValue) {
    return false;
  }

  if (
    CONSENT_STATE_IDENTIFIERS.has(
      normalisedValue,
    )
  ) {
    return true;
  }

  return (
    normalisedValue.includes(
      "consent",
    ) ||
    normalisedValue.includes(
      "cookie_preferences",
    ) ||
    normalisedValue.includes(
      "privacy_preferences",
    )
  );
}

function containsTrackingIdentifier(
  source,
) {
  return TRACKING_IDENTIFIER_PATTERNS.some(
    (pattern) =>
      pattern.test(
        String(source ?? ""),
      ),
  );
}

function isConsentCondition(
  source,
) {
  return CONSENT_CONDITION_PATTERNS.some(
    (pattern) =>
      pattern.test(
        String(source ?? ""),
      ),
  );
}

function isCleanupFunctionName(
  functionName,
) {
  if (!functionName) {
    return false;
  }

  return CLEANUP_FUNCTION_PATTERNS.some(
    (pattern) =>
      pattern.test(
        functionName,
      ),
  );
}

function extractFunctionName(
  line,
) {
  const patterns = [
    /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/,

    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,

    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/,

    /^\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      String(line).match(
        pattern,
      );

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function extractConditionText(
  line,
) {
  const match =
    String(line).match(
      /\b(?:if|else\s+if|while)\s*\((.*)\)\s*\{?/,
    );

  return (
    match?.[1] ??
    null
  );
}

function buildLineContexts(
  lines,
) {
  const contexts = [];

  const functionStack = [];
  const conditionStack = [];

  let braceDepth = 0;

  for (
    let lineIndex = 0;
    lineIndex <
    lines.length;
    lineIndex += 1
  ) {
    const line =
      removeInlineComment(
        lines[lineIndex],
      );

    while (
      functionStack.length >
        0 &&
      braceDepth <
        functionStack[
          functionStack.length -
            1
        ].bodyDepth
    ) {
      functionStack.pop();
    }

    while (
      conditionStack.length >
        0 &&
      braceDepth <
        conditionStack[
          conditionStack.length -
            1
        ].bodyDepth
    ) {
      conditionStack.pop();
    }

    const functionName =
      extractFunctionName(
        line,
      );

    const conditionText =
      extractConditionText(
        line,
      );

    const openingBraces =
      countCharacter(
        line,
        "{",
      );

    if (
      functionName &&
      openingBraces > 0
    ) {
      functionStack.push({
        name:
          functionName,

        startLine:
          lineIndex + 1,

        bodyDepth:
          braceDepth + 1,
      });
    }

    if (
      conditionText &&
      openingBraces > 0
    ) {
      conditionStack.push({
        condition:
          conditionText,

        startLine:
          lineIndex + 1,

        bodyDepth:
          braceDepth + 1,

        consentRelated:
          isConsentCondition(
            conditionText,
          ),
      });
    }

    const currentFunction =
      functionStack[
        functionStack.length -
          1
      ] ?? null;

    const activeConditions =
      conditionStack.map(
        (condition) => ({
          ...condition,
        }),
      );

    contexts.push({
      functionName:
        currentFunction
          ?.name ?? null,

      functionStartLine:
        currentFunction
          ?.startLine ?? null,

      isTopLevel:
        !currentFunction,

      activeConditions,

      hasConsentCondition:
        activeConditions.some(
          (condition) =>
            condition
              .consentRelated,
        ),
    });

    braceDepth +=
      getBraceDifference(
        line,
      );

    braceDepth =
      Math.max(
        0,
        braceDepth,
      );
  }

  return contexts;
}

function extractCookieName({
  lines,
  lineIndex,
}) {
  const nearbySource =
    lines
      .slice(
        lineIndex,
        Math.min(
          lines.length,
          lineIndex + 4,
        ),
      )
      .join(" ");

  const assignmentMatch =
    nearbySource.match(
      /document\.cookie\s*=\s*[`"']\s*([A-Za-z0-9_.-]+)\s*=/i,
    );

  return (
    assignmentMatch?.[1] ??
    null
  );
}

function extractStorageKey({
  lines,
  lineIndex,
}) {
  const nearbySource =
    lines
      .slice(
        lineIndex,
        Math.min(
          lines.length,
          lineIndex + 4,
        ),
      )
      .join(" ");

  const literalMatch =
    nearbySource.match(
      /(?:window\.)?(?:localStorage|sessionStorage)\.setItem\s*\(\s*["'`]([^"'`]+)["'`]/i,
    );

  if (literalMatch?.[1]) {
    return literalMatch[1];
  }

  const identifierMatch =
    nearbySource.match(
      /(?:window\.)?(?:localStorage|sessionStorage)\.setItem\s*\(\s*([A-Za-z_$][\w$]*)/i,
    );

  return (
    identifierMatch?.[1] ??
    null
  );
}

function isCookieDeletionOperation({
  lines,
  lineIndex,
}) {
  const nearbySource =
    lines
      .slice(
        Math.max(
          0,
          lineIndex - 1,
        ),

        Math.min(
          lines.length,
          lineIndex + 5,
        ),
      )
      .join(" ");

  return (
    /max-age\s*=\s*0/i.test(
      nearbySource,
    ) ||
    /expires\s*=\s*[^;]*(1970|past)/i.test(
      nearbySource,
    ) ||
    /document\.cookie\s*=\s*[`"'][^=`"']+=\s*;/i.test(
      nearbySource,
    )
  );
}

function extractCalledFunctionNames(
  line,
) {
  const names = [];

  const ignoredNames =
    new Set([
      "if",
      "for",
      "while",
      "switch",
      "catch",
      "function",
      "return",
      "setTimeout",
      "setInterval",
      "fetch",
      "map",
      "filter",
      "find",
      "some",
      "every",
      "reduce",
      "forEach",
    ]);

  const callPattern =
    /\b([A-Za-z_$][\w$]*)\s*\(/g;

  let match =
    callPattern.exec(
      line,
    );

  while (match) {
    const functionName =
      match[1];

    if (
      !ignoredNames.has(
        functionName,
      )
    ) {
      names.push(
        functionName,
      );
    }

    match =
      callPattern.exec(
        line,
      );
  }

  return names;
}

/*
 * Builds one call index for every scanned file.
 *
 * This allows a function declared in analytics.js
 * to be matched with a guarded call in app.js.
 */
function buildProjectFunctionCallIndex(
  sourceRecords,
) {
  const callIndex =
    new Map();

  for (
    const sourceRecord of
    sourceRecords
  ) {
    const {
      lines,
      contexts,
      relativeFilePath,
    } = sourceRecord;

    for (
      let lineIndex = 0;
      lineIndex <
      lines.length;
      lineIndex += 1
    ) {
      const line =
        removeInlineComment(
          lines[lineIndex],
        );

      const calledFunctions =
        extractCalledFunctionNames(
          line,
        );

      for (
        const functionName of
        calledFunctions
      ) {
        const declaredFunctionName =
          extractFunctionName(
            line,
          );

        /*
         * Do not mistake a function
         * declaration for a function call.
         */
        if (
          declaredFunctionName ===
          functionName
        ) {
          continue;
        }

        const context =
          contexts[lineIndex] ??
          {};

        const existingCalls =
          callIndex.get(
            functionName,
          ) ?? [];

        existingCalls.push({
          functionName,

          file:
            relativeFilePath,

          line:
            lineIndex + 1,

          lineIndex,

          source:
            line.trim(),

          callerFunction:
            context.functionName ??
            null,

          isTopLevel:
            context.isTopLevel ??
            true,

          hasConsentCondition:
            context
              .hasConsentCondition ??
            false,

          activeConditions:
            context
              .activeConditions ??
            [],
        });

        callIndex.set(
          functionName,
          existingCalls,
        );
      }
    }
  }

  return callIndex;
}

function classifyFunctionExecution({
  functionName,
  projectFunctionCallIndex,
}) {
  if (!functionName) {
    return {
      classification:
        "top-level",

      reason:
        "The operation appears outside a named function and may execute when the module loads.",

      calls: [],
    };
  }

  if (
    isCleanupFunctionName(
      functionName,
    )
  ) {
    return {
      classification:
        "cleanup-function",

      reason:
        `The operation is inside the cleanup-style function "${functionName}".`,

      calls:
        projectFunctionCallIndex.get(
          functionName,
        ) ?? [],
    };
  }

  const calls =
    projectFunctionCallIndex.get(
      functionName,
    ) ?? [];

  if (calls.length === 0) {
    return {
      classification:
        "unresolved-function",

      reason:
        `The operation is inside "${functionName}", but no direct call to that function was found in the scanned project.`,

      calls,
    };
  }

  const consentGatedCalls =
    calls.filter(
      (call) =>
        call
          .hasConsentCondition,
    );

  const unguardedCalls =
    calls.filter(
      (call) =>
        !call
          .hasConsentCondition,
    );

  if (
    consentGatedCalls.length ===
      calls.length
  ) {
    return {
      classification:
        "consent-gated",

      reason:
        `All ${calls.length} detected call${calls.length === 1 ? "" : "s"} to "${functionName}" are inside recognised consent conditions across the scanned project.`,

      calls,
    };
  }

  if (
    unguardedCalls.length > 0
  ) {
    return {
      classification:
        "unguarded-call",

      reason:
        `${unguardedCalls.length} detected call${unguardedCalls.length === 1 ? "" : "s"} to "${functionName}" are not inside a recognised consent condition.`,

      calls,
    };
  }

  return {
    classification:
      "unresolved-function",

    reason:
      `The execution context for "${functionName}" could not be determined confidently.`,

    calls,
  };
}

function shouldSuppressConsentStateOperation({
  rule,
  relativeFilePath,
  cookieName,
  storageKey,
  nearbySource,
}) {
  if (
    ![
      "DIRECT_COOKIE_ASSIGNMENT",
      "LOCAL_STORAGE_WRITE",
      "SESSION_STORAGE_WRITE",
    ].includes(
      rule.ruleId,
    )
  ) {
    return false;
  }

  const identifier =
    cookieName ??
    storageKey;

  if (
    identifier &&
    isConsentIdentifier(
      identifier,
    )
  ) {
    return true;
  }

  if (
    isConsentFile(
      relativeFilePath,
    ) &&
    /\bconsent\b/i.test(
      nearbySource,
    )
  ) {
    return true;
  }

  return false;
}

function determineFindingSeverity({
  rule,
  context,
  execution,
  nearbySource,
  cookieName,
  storageKey,
}) {
  if (
    context.isTopLevel
  ) {
    if (
      rule.defaultSeverity ===
      "high"
    ) {
      return "high";
    }

    return containsTrackingIdentifier(
      nearbySource,
    )
      ? "high"
      : "medium";
  }

  if (
    execution.classification ===
      "unguarded-call"
  ) {
    if (
      rule.defaultSeverity ===
      "high"
    ) {
      return "high";
    }

    return containsTrackingIdentifier(
      [
        nearbySource,
        cookieName,
        storageKey,
      ].join(" "),
    )
      ? "high"
      : "medium";
  }

  if (
    execution.classification ===
      "unresolved-function"
  ) {
    return containsTrackingIdentifier(
      [
        nearbySource,
        cookieName,
        storageKey,
      ].join(" "),
    )
      ? "medium"
      : "low";
  }

  return rule.defaultSeverity;
}

function createFindingDescription({
  rule,
  relativeFilePath,
  lineNumber,
  context,
  execution,
}) {
  const functionText =
    context.functionName
      ? ` The operation is inside the function "${context.functionName}".`
      : " The operation appears at module or document scope.";

  return (
    `${rule.description} Found in ` +
    `"${relativeFilePath}" at line ${lineNumber}.` +
    functionText +
    ` ${execution.reason}`
  );
}

function analyseSourceLine({
  line,
  lineIndex,
  lines,
  contexts,
  projectFunctionCallIndex,
  relativeFilePath,
}) {
  const findings = [];

  const context =
    contexts[lineIndex] ?? {
      functionName: null,
      functionStartLine:
        null,
      isTopLevel: true,
      activeConditions: [],
      hasConsentCondition:
        false,
    };

  const nearbySource =
    lines
      .slice(
        Math.max(
          0,
          lineIndex - 2,
        ),

        Math.min(
          lines.length,
          lineIndex + 5,
        ),
      )
      .join(" ");

  const cookieDeletion =
    isCookieDeletionOperation({
      lines,
      lineIndex,
    });

  const cookieName =
    extractCookieName({
      lines,
      lineIndex,
    });

  const storageKey =
    extractStorageKey({
      lines,
      lineIndex,
    });

  const execution =
    classifyFunctionExecution({
      functionName:
        context.functionName,

      projectFunctionCallIndex,
    });

  for (
    const rule of
    SOURCE_RULES
  ) {
    const matchingPattern =
      rule.patterns.find(
        (pattern) =>
          pattern.test(
            line,
          ),
      );

    if (!matchingPattern) {
      continue;
    }

    /*
     * Cookie cleanup is not cookie creation.
     */
    if (
      rule.ruleId ===
        "DIRECT_COOKIE_ASSIGNMENT" &&
      cookieDeletion
    ) {
      continue;
    }

    /*
     * Consent-state persistence is necessary
     * for remembering the user's selection.
     */
    if (
      shouldSuppressConsentStateOperation({
        rule,
        relativeFilePath,
        cookieName,
        storageKey,
        nearbySource,
      })
    ) {
      continue;
    }

    /*
     * Cleanup functions remove or disable
     * tracking state rather than creating it.
     */
    if (
      execution.classification ===
        "cleanup-function"
    ) {
      continue;
    }

    /*
     * Suppress operations whose detected
     * project-wide calls are all consent-gated.
     */
    if (
      execution.classification ===
        "consent-gated"
    ) {
      continue;
    }

    /*
     * Suppress operations protected directly
     * by a recognised condition in the same
     * function.
     */
    if (
      context
        .hasConsentCondition
    ) {
      continue;
    }

    const lineNumber =
      lineIndex + 1;

    const severity =
      determineFindingSeverity({
        rule,
        context,
        execution,
        nearbySource,
        cookieName,
        storageKey,
      });

    findings.push({
      category:
        "source-code",

      phase:
        "source-analysis",

      type:
        rule.ruleId,

      severity,

      title:
        rule.title,

      description:
        createFindingDescription({
          rule,
          relativeFilePath,
          lineNumber,
          context,
          execution,
        }),

      evidence: {
        ruleId:
          rule.ruleId,

        file:
          relativeFilePath,

        line:
          lineNumber,

        column:
          Math.max(
            1,
            line.search(
              matchingPattern,
            ) + 1,
          ),

        snippet:
          getEvidenceSnippet({
            lines,
            lineIndex,
          }),

        matchedLine:
          line.trim(),

        functionName:
          context.functionName,

        functionStartLine:
          context
            .functionStartLine,

        executionContext:
          execution
            .classification,

        executionReason:
          execution.reason,

        detectedCalls:
          execution.calls.map(
            (call) => ({
              file:
                call.file,

              line:
                call.line,

              source:
                call.source,

              callerFunction:
                call
                  .callerFunction,

              isTopLevel:
                call
                  .isTopLevel,

              consentGated:
                call
                  .hasConsentCondition,

              conditions:
                call
                  .activeConditions
                  .map(
                    (
                      condition,
                    ) =>
                      condition
                        .condition,
                  ),
            }),
          ),

        activeConditions:
          context
            .activeConditions
            .map(
              (condition) =>
                condition
                  .condition,
            ),

        cookieName,

        storageKey,

        guidance:
          rule.guidance,
      },
    });
  }

  return findings;
}

async function loadSourceFile({
  absoluteFilePath,
  sourceRoot,
}) {
  const fileInformation =
    await stat(
      absoluteFilePath,
    );

  if (
    fileInformation.size >
    MAX_FILE_SIZE_BYTES
  ) {
    return null;
  }

  const fileContent =
    await readFile(
      absoluteFilePath,
      "utf8",
    );

  const lines =
    fileContent.split(
      /\r?\n/,
    );

  const relativeFilePath =
    normalisePathSeparators(
      path.relative(
        sourceRoot,
        absoluteFilePath,
      ),
    );

  return {
    absoluteFilePath,
    relativeFilePath,
    lines,

    contexts:
      buildLineContexts(
        lines,
      ),
  };
}

function analyseSourceRecord({
  sourceRecord,
  projectFunctionCallIndex,
}) {
  const {
    lines,
    contexts,
    relativeFilePath,
  } = sourceRecord;

  const findings = [];

  for (
    let lineIndex = 0;
    lineIndex <
    lines.length;
    lineIndex += 1
  ) {
    findings.push(
      ...analyseSourceLine({
        line:
          lines[lineIndex],

        lineIndex,

        lines,

        contexts,

        projectFunctionCallIndex,

        relativeFilePath,
      }),
    );
  }

  return findings;
}

function removeDuplicateFindings(
  findings,
) {
  const seenFindings =
    new Set();

  return findings.filter(
    (finding) => {
      const identifier = [
        finding.type,

        finding
          .evidence?.file,

        finding
          .evidence?.line,

        finding
          .evidence
          ?.functionName,
      ].join("|");

      if (
        seenFindings.has(
          identifier,
        )
      ) {
        return false;
      }

      seenFindings.add(
        identifier,
      );

      return true;
    },
  );
}

export async function scanSourceCode({
  sourceCodeFolder,
  onStepChange =
    async () => {},
}) {
  await onStepChange(
    "Validating source-code folder",
  );

  const {
    sourceRoot,
    resolvedFolder,
  } =
    resolveSafeSourceFolder(
      sourceCodeFolder,
    );

  try {
    await access(
      resolvedFolder,
    );
  } catch (error) {
    throw new Error(
      [
        "The requested source-code folder does not exist or cannot be accessed.",

        `Configured root: ${sourceRoot}`,

        `Requested folder: ${sourceCodeFolder}`,

        `Resolved path: ${resolvedFolder}`,

        `Filesystem error: ${error.message}`,
      ].join("\n"),
    );
  }

  const folderInformation =
    await stat(
      resolvedFolder,
    );

  if (
    !folderInformation
      .isDirectory()
  ) {
    throw new Error(
      "The selected source-code path is not a directory.",
    );
  }

  await onStepChange(
    "Discovering source-code files",
  );

  const sourceFiles =
    await collectSourceFiles(
      resolvedFolder,
    );

  await onStepChange(
    `Indexing ${sourceFiles.length} source-code file${
      sourceFiles.length === 1
        ? ""
        : "s"
    }`,
  );

  /*
   * Read and parse every file before analysing
   * individual findings. This enables cross-file
   * function-call analysis.
   */
  const sourceRecords = [];

  for (
    let fileIndex = 0;
    fileIndex <
    sourceFiles.length;
    fileIndex += 1
  ) {
    const sourceRecord =
      await loadSourceFile({
        absoluteFilePath:
          sourceFiles[
            fileIndex
          ],

        sourceRoot,
      });

    if (sourceRecord) {
      sourceRecords.push(
        sourceRecord,
      );
    }

    if (
      fileIndex > 0 &&
      fileIndex % 25 ===
        0
    ) {
      await onStepChange(
        `Indexed ${fileIndex} of ${sourceFiles.length} source-code files`,
      );
    }
  }

  await onStepChange(
    "Building project-wide function-call index",
  );

  const projectFunctionCallIndex =
    buildProjectFunctionCallIndex(
      sourceRecords,
    );

  await onStepChange(
    `Analysing ${sourceRecords.length} indexed source-code file${
      sourceRecords.length === 1
        ? ""
        : "s"
    }`,
  );

  const findings = [];

  for (
    let fileIndex = 0;
    fileIndex <
    sourceRecords.length;
    fileIndex += 1
  ) {
    findings.push(
      ...analyseSourceRecord({
        sourceRecord:
          sourceRecords[
            fileIndex
          ],

        projectFunctionCallIndex,
      }),
    );

    if (
      fileIndex > 0 &&
      fileIndex % 25 ===
        0
    ) {
      await onStepChange(
        `Analysed ${fileIndex} of ${sourceRecords.length} source-code files`,
      );
    }
  }

  const uniqueFindings =
    removeDuplicateFindings(
      findings,
    );

  return {
    findings:
      uniqueFindings,

    metadata: {
      sourceRoot,

      requestedFolder:
        String(
          sourceCodeFolder,
        ).trim(),

      resolvedFolder,

      filesDiscovered:
        sourceFiles.length,

      filesScanned:
        sourceRecords.length,

      indexedFunctionNames:
        projectFunctionCallIndex
          .size,

      findingsDetected:
        uniqueFindings.length,

      maximumFiles:
        MAX_FILES_PER_SCAN,

      analysisMethod:
        "Pattern analysis with project-wide function-call, consent-condition and execution-context heuristics",
    },
  };
}