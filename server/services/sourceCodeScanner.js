import {
  access,
  readFile,
  readdir,
  stat,
} from "node:fs/promises";

import path from "node:path";

const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".htm",
]);

const IGNORED_DIRECTORIES = new Set([
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

const MAX_FILES_PER_SCAN = 500;

const SOURCE_RULES = [
  {
    ruleId: "TRACKER_SCRIPT_TAG",
    severity: "high",
    title:
      "Tracking script may load without consent gating",
    description:
      "A known tracking or analytics script appears to be loaded directly in the source code.",
    guidance:
      "Load the tracking script only after the user has granted the relevant consent category.",
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
    ruleId: "GTAG_INITIALISATION",
    severity: "high",
    title:
      "Google Analytics initialisation detected",
    description:
      "A gtag configuration call was found and may execute before consent is checked.",
    guidance:
      "Move gtag initialisation into a function that runs only after analytics consent has been granted.",
    patterns: [
      /\bgtag\s*\(\s*["']config["']/i,
      /\bgtag\s*\(\s*["']event["']/i,
    ],
  },

  {
    ruleId: "GOOGLE_TAG_MANAGER_INITIALISATION",
    severity: "high",
    title:
      "Google Tag Manager initialisation detected",
    description:
      "Google Tag Manager initialisation code was found and may load tracking tags before consent.",
    guidance:
      "Do not inject the Tag Manager script until the relevant consent category has been accepted.",
    patterns: [
      /\bdataLayer\b.*\bgtm\.start\b/i,
      /\bGTM-[A-Z0-9]+\b/i,
    ],
  },

  {
    ruleId: "META_PIXEL_INITIALISATION",
    severity: "high",
    title:
      "Meta Pixel initialisation detected",
    description:
      "Meta Pixel initialisation or tracking code was found.",
    guidance:
      "Call fbq only after marketing consent has been granted.",
    patterns: [
      /\bfbq\s*\(\s*["']init["']/i,
      /\bfbq\s*\(\s*["']track["']/i,
    ],
  },

  {
    ruleId: "HOTJAR_INITIALISATION",
    severity: "high",
    title:
      "Hotjar initialisation detected",
    description:
      "Hotjar tracking code was found and may execute before consent.",
    guidance:
      "Initialise Hotjar only after analytics or performance consent has been granted.",
    patterns: [
      /\bhj\s*\(\s*["']trigger["']/i,
      /\bhj\s*\(\s*["']identify["']/i,
      /\bhj\s*=\s*window\.hj/i,
    ],
  },

  {
    ruleId: "DIRECT_COOKIE_ASSIGNMENT",
    severity: "medium",
    title:
      "Direct cookie assignment detected",
    description:
      "The source code writes directly to document.cookie. Manual review is required to confirm that the cookie is necessary or consent-gated.",
    guidance:
      "Place non-essential cookie creation behind an explicit consent condition.",
    patterns: [
      /\bdocument\.cookie\s*=/i,
    ],
  },

  {
    ruleId: "LOCAL_STORAGE_WRITE",
    severity: "medium",
    title:
      "localStorage write detected",
    description:
      "The source code writes data to localStorage. Manual review is required to confirm whether the data is necessary or consent-gated.",
    guidance:
      "Avoid storing analytics or advertising identifiers until the relevant consent has been granted.",
    patterns: [
      /\blocalStorage\.setItem\s*\(/i,
      /\bwindow\.localStorage\.setItem\s*\(/i,
    ],
  },

  {
    ruleId: "SESSION_STORAGE_WRITE",
    severity: "low",
    title:
      "sessionStorage write detected",
    description:
      "The source code writes data to sessionStorage. Review whether the stored value is necessary and appropriately gated.",
    guidance:
      "Ensure any non-essential browser-storage write occurs only after valid consent.",
    patterns: [
      /\bsessionStorage\.setItem\s*\(/i,
      /\bwindow\.sessionStorage\.setItem\s*\(/i,
    ],
  },

  {
    ruleId: "DYNAMIC_EXTERNAL_SCRIPT",
    severity: "medium",
    title:
      "Dynamic external script injection detected",
    description:
      "The source code dynamically creates or assigns a script source. This may be used to load tracking services.",
    guidance:
      "Ensure the script injection function is called only after the required consent category has been accepted.",
    patterns: [
      /createElement\s*\(\s*["']script["']\s*\)/i,
      /\.src\s*=\s*["']https?:\/\//i,
      /setAttribute\s*\(\s*["']src["']\s*,\s*["']https?:\/\//i,
    ],
  },

  {
    ruleId: "TRACKING_FETCH_REQUEST",
    severity: "medium",
    title:
      "Potential tracking request detected",
    description:
      "A fetch or XMLHttpRequest call appears to target an analytics, tracking or collection endpoint.",
    guidance:
      "Send tracking requests only after the user has granted the relevant consent.",
    patterns: [
      /\bfetch\s*\([^)]*(analytics|tracking|collect|telemetry|pixel|beacon)/i,
      /\bXMLHttpRequest\b.*(analytics|tracking|collect|telemetry|pixel|beacon)/i,
      /\bnavigator\.sendBeacon\s*\(/i,
    ],
  },
];

function normalisePathSeparators(
  filePath,
) {
  return filePath.split(path.sep).join("/");
}

function getConfiguredSourceRoot() {
  const configuredRoot =
    process.env.SCAN_SOURCE_ROOT;

  if (!configuredRoot) {
    throw new Error(
      "SCAN_SOURCE_ROOT is not configured in the server environment.",
    );
  }

  return path.resolve(
    configuredRoot,
  );
}

function resolveSafeSourceFolder(
  requestedFolder,
) {
  const sourceRoot =
    getConfiguredSourceRoot();

  const cleanedFolder =
    String(requestedFolder ?? "").trim();

  if (!cleanedFolder) {
    throw new Error(
      "A source-code folder is required when source-code scanning is enabled.",
    );
  }

  /*
   * Treat the submitted value as a folder relative
   * to SCAN_SOURCE_ROOT.
   */
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
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath);

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
    directoryName.toLowerCase(),
  );
}

function isSupportedFile(
  filePath,
) {
  return SUPPORTED_EXTENSIONS.has(
    path.extname(filePath).toLowerCase(),
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

  for (const entry of entries) {
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

    if (entry.isDirectory()) {
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
      isSupportedFile(entryPath)
    ) {
      collectedFiles.push(
        entryPath,
      );
    }
  }

  return collectedFiles;
}

function getEvidenceSnippet({
  lines,
  lineIndex,
}) {
  const startIndex =
    Math.max(
      0,
      lineIndex - 1,
    );

  const endIndex =
    Math.min(
      lines.length,
      lineIndex + 2,
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

        return `${lineNumber}: ${line}`;
      },
    )
    .join("\n");
}

function analyseSourceLine({
  line,
  lineIndex,
  lines,
  relativeFilePath,
}) {
  const findings = [];

  for (const rule of SOURCE_RULES) {
    const matchingPattern =
      rule.patterns.find(
        (pattern) =>
          pattern.test(line),
      );

    if (!matchingPattern) {
      continue;
    }

    const lineNumber =
      lineIndex + 1;

    findings.push({
      category: "source-code",
      phase: "source-analysis",
      type: rule.ruleId,
      severity: rule.severity,
      title: rule.title,
      description:
        `${rule.description} Found in ` +
        `"${relativeFilePath}" at line ${lineNumber}.`,
      evidence: {
        ruleId: rule.ruleId,
        file: relativeFilePath,
        line: lineNumber,
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
        guidance:
          rule.guidance,
      },
    });
  }

  return findings;
}

async function analyseSourceFile({
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
    return [];
  }

  const fileContent =
    await readFile(
      absoluteFilePath,
      "utf8",
    );

  const lines =
    fileContent.split(/\r?\n/);

  const relativeFilePath =
    normalisePathSeparators(
      path.relative(
        sourceRoot,
        absoluteFilePath,
      ),
    );

  const findings = [];

  for (
    let lineIndex = 0;
    lineIndex < lines.length;
    lineIndex += 1
  ) {
    findings.push(
      ...analyseSourceLine({
        line: lines[lineIndex],
        lineIndex,
        lines,
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
        finding.evidence?.file,
        finding.evidence?.line,
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
  onStepChange = async () => {},
}) {
  await onStepChange(
    "Validating source-code folder",
  );

  const {
    sourceRoot,
    resolvedFolder,
  } = resolveSafeSourceFolder(
    sourceCodeFolder,
  );

  try {
    await access(
      resolvedFolder,
    );
  } catch {
    throw new Error(
      "The requested source-code folder does not exist or cannot be accessed.",
    );
  }

  const folderInformation =
    await stat(
      resolvedFolder,
    );

  if (
    !folderInformation.isDirectory()
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
    `Analysing ${sourceFiles.length} source-code file${
      sourceFiles.length === 1
        ? ""
        : "s"
    }`,
  );

  const findings = [];

  for (
    let fileIndex = 0;
    fileIndex < sourceFiles.length;
    fileIndex += 1
  ) {
    const absoluteFilePath =
      sourceFiles[fileIndex];

    findings.push(
      ...await analyseSourceFile({
        absoluteFilePath,
        sourceRoot,
      }),
    );

    if (
      fileIndex > 0 &&
      fileIndex % 25 === 0
    ) {
      await onStepChange(
        `Analysed ${fileIndex} of ${sourceFiles.length} source-code files`,
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
      filesScanned:
        sourceFiles.length,
      findingsDetected:
        uniqueFindings.length,
      maximumFiles:
        MAX_FILES_PER_SCAN,
    },
  };
}