export const RULES_STORAGE_KEY =
  "cookiesolve-rules";

export const defaultRules = {
  cookies: [
    "session_id",
    "csrf_token",
  ],

  storage: [
    "site_consent",
  ],

  domains: [
    "localhost",
    "cdn.safe.com",
  ],

  keywords: [
    "analytics",
    "facebook",
  ],

  patterns: [
    "document.cookie",
    "gtag",
    "fbq",
  ],
};

function sanitiseList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) =>
          String(item).trim(),
        )
        .filter(Boolean),
    ),
  ];
}

export function normaliseRules(
  rules,
) {
  return {
    cookies:
      sanitiseList(
        rules?.cookies,
      ),

    storage:
      sanitiseList(
        rules?.storage,
      ),

    domains:
      sanitiseList(
        rules?.domains,
      ),

    keywords:
      sanitiseList(
        rules?.keywords,
      ),

    patterns:
      sanitiseList(
        rules?.patterns,
      ),
  };
}

export function loadRules() {
  const savedRules =
    window.localStorage.getItem(
      RULES_STORAGE_KEY,
    );

  if (!savedRules) {
    return {
      ...defaultRules,
    };
  }

  try {
    const parsed =
      JSON.parse(
        savedRules,
      );

    return normaliseRules({
      ...defaultRules,
      ...parsed,
    });
  } catch {
    return {
      ...defaultRules,
    };
  }
}

export function saveRules(
  rules,
) {
  const cleanedRules =
    normaliseRules(
      rules,
    );

  window.localStorage.setItem(
    RULES_STORAGE_KEY,
    JSON.stringify(
      cleanedRules,
    ),
  );

  return cleanedRules;
}

export function resetRules() {
  const defaults =
    normaliseRules(
      defaultRules,
    );

  window.localStorage.setItem(
    RULES_STORAGE_KEY,
    JSON.stringify(
      defaults,
    ),
  );

  return defaults;
}