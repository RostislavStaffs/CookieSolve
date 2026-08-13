import {
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../components/DashboardLayout";
import AddRuleModal from "../components/AddRuleModal";

import {
  loadRules,
  resetRules as resetStoredRules,
  saveRules,
} from "../services/rulesConfig";

import "./RulesAllowlistPage.css";

const modalConfigurations = {
  cookies: {
    title:
      "Add Necessary Cookie",

    description:
      "Choose a common essential cookie or enter the exact cookie name used by your website.",

    placeholder:
      "Example: cookie_consent",

    options: [
      {
        label:
          "Session cookie",

        value:
          "session_id",

        description:
          "Maintains the user's active authenticated session.",
      },

      {
        label:
          "CSRF token",

        value:
          "csrf_token",

        description:
          "Protects forms and requests against CSRF attacks.",
      },

      {
        label:
          "Consent preference",

        value:
          "cookie_consent",

        description:
          "Stores the user's cookie-consent selection.",
      },

      {
        label:
          "Authentication token",

        value:
          "auth_token",

        description:
          "Maintains authenticated access.",
      },
    ],
  },

  storage: {
    title:
      "Add Necessary Storage Key",

    description:
      "Choose or enter a localStorage or sessionStorage key that is required for the website to operate or remember consent.",

    placeholder:
      "Example: site_consent",

    options: [
      {
        label:
          "Site consent",

        value:
          "site_consent",

        description:
          "Stores the visitor's consent preferences.",
      },

      {
        label:
          "Consent preferences",

        value:
          "consent_preferences",

        description:
          "Stores selected consent categories.",
      },

      {
        label:
          "Application settings",

        value:
          "app_settings",

        description:
          "Stores necessary application preferences.",
      },
    ],
  },

  domains: {
    title:
      "Add Ignored Domain",

    description:
      "Requests to ignored domains can be excluded from tracking classification.",

    placeholder:
      "Example: cdn.example.com",

    options: [
      {
        label:
          "Local development",

        value:
          "localhost",

        description:
          "Ignore requests made to the local development host.",
      },

      {
        label:
          "Static asset CDN",

        value:
          "cdn.safe.com",

        description:
          "Ignore a trusted content-delivery domain.",
      },

      {
        label:
          "Internal API",

        value:
          "api.internal",

        description:
          "Ignore a trusted internal service domain.",
      },
    ],
  },

  keywords: {
    title:
      "Add Tracking Keyword",

    description:
      "Tracking keywords help identify analytics, advertising and tracking-related resources.",

    placeholder:
      "Example: analytics",

    options: [
      {
        label:
          "Analytics",

        value:
          "analytics",

        description:
          "Detect common analytics-related resources.",
      },

      {
        label:
          "Facebook",

        value:
          "facebook",

        description:
          "Detect Facebook Pixel and related tracking requests.",
      },

      {
        label:
          "Advertising",

        value:
          "advertising",

        description:
          "Detect advertising and behavioural-marketing patterns.",
      },

      {
        label:
          "Telemetry",

        value:
          "telemetry",

        description:
          "Detect telemetry collection endpoints.",
      },
    ],
  },

  patterns: {
    title:
      "Add Source Code Pattern",

    description:
      "Source-code patterns identify potentially relevant tracking or storage logic during static analysis.",

    placeholder:
      "Example: document.cookie",

    options: [
      {
        label:
          "document.cookie",

        value:
          "document.cookie",

        description:
          "Detect direct cookie writes in JavaScript.",
      },

      {
        label:
          "Google tag",

        value:
          "gtag",

        description:
          "Detect Google Analytics or Google Tag calls.",
      },

      {
        label:
          "Facebook queue",

        value:
          "fbq",

        description:
          "Detect Facebook Pixel initialisation and events.",
      },

      {
        label:
          "localStorage",

        value:
          "localStorage.setItem",

        description:
          "Detect browser local-storage writes.",
      },
    ],
  },
};

function RulesAllowlistPage() {
  const [
    rules,
    setRules,
  ] = useState(
    () => loadRules(),
  );

  const [
    activeModal,
    setActiveModal,
  ] = useState(null);

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");

  const modalConfig =
    useMemo(() => {
      if (!activeModal) {
        return null;
      }

      return modalConfigurations[
        activeModal
      ];
    }, [activeModal]);

  function showMessage(
    message,
  ) {
    setSavedMessage(
      message,
    );

    window.setTimeout(
      () => {
        setSavedMessage(
          "",
        );
      },
      1800,
    );
  }

  function addRule(
    group,
    value,
  ) {
    const cleanedValue =
      String(value)
        .trim();

    if (!cleanedValue) {
      return;
    }

    setRules(
      (currentRules) => {
        if (
          currentRules[
            group
          ].includes(
            cleanedValue,
          )
        ) {
          return currentRules;
        }

        const updatedRules = {
          ...currentRules,

          [group]: [
            ...currentRules[
              group
            ],

            cleanedValue,
          ],
        };

        /*
         * Persist immediately so the
         * New Scan page always receives
         * the latest configuration.
         */
        saveRules(
          updatedRules,
        );

        return updatedRules;
      },
    );
  }

  function removeRule(
    group,
    value,
  ) {
    setRules(
      (currentRules) => {
        const updatedRules = {
          ...currentRules,

          [group]:
            currentRules[
              group
            ].filter(
              (item) =>
                item !==
                value,
            ),
        };

        saveRules(
          updatedRules,
        );

        return updatedRules;
      },
    );
  }

  function handleSave() {
    const savedRules =
      saveRules(
        rules,
      );

    setRules(
      savedRules,
    );

    showMessage(
      "Rules saved",
    );
  }

  function handleResetRules() {
    const defaults =
      resetStoredRules();

    setRules(
      defaults,
    );

    showMessage(
      "Defaults restored",
    );
  }

  function renderRuleGroup({
    title,
    group,
    buttonLabel,
  }) {
    return (
      <section className="rules-group">
        <h2>
          {title}
        </h2>

        <div className="rules-group-content">
          <div className="rule-chip-list">
            {rules[group].map(
              (rule) => (
                <span
                  className="rule-chip"
                  key={rule}
                >
                  <span>
                    {rule}
                  </span>

                  <button
                    type="button"
                    aria-label={`Remove ${rule}`}
                    onClick={() =>
                      removeRule(
                        group,
                        rule,
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ),
            )}

            {rules[group]
              .length === 0 && (
              <span className="empty-rule-message">
                No values added
              </span>
            )}
          </div>

          <button
            className="add-rule-button"
            type="button"
            onClick={() =>
              setActiveModal(
                group,
              )
            }
          >
            <span
              aria-hidden="true"
            >
              +
            </span>

            {buttonLabel}
          </button>
        </div>
      </section>
    );
  }

  return (
    <DashboardLayout
      activePage="Rules & Allowlist"
      title="Rules & Allowlist"
    >
      <section className="rules-page">
        <header className="rules-page-heading">
          <h1>
            Rules & Allowlist
          </h1>

          <p>
            Configure the rules used when analysing websites.
          </p>
        </header>

        <section className="rules-panel">
          <div className="rules-panel-content">
            {renderRuleGroup({
              title:
                "Necessary Cookies",

              group:
                "cookies",

              buttonLabel:
                "Add Cookie",
            })}

            {renderRuleGroup({
              title:
                "Necessary Storage",

              group:
                "storage",

              buttonLabel:
                "Add Storage",
            })}

            {renderRuleGroup({
              title:
                "Ignored Domains",

              group:
                "domains",

              buttonLabel:
                "Add Domain",
            })}

            {renderRuleGroup({
              title:
                "Tracking Keywords",

              group:
                "keywords",

              buttonLabel:
                "Add Keyword",
            })}

            {renderRuleGroup({
              title:
                "Source Code Patterns",

              group:
                "patterns",

              buttonLabel:
                "Add Pattern",
            })}
          </div>

          <footer className="rules-panel-footer">
            <div
              className="rules-save-message"
              aria-live="polite"
            >
              {savedMessage}
            </div>

            <div className="rules-footer-actions">
              <button
                className="save-rules-button"
                type="button"
                onClick={
                  handleSave
                }
              >
                Save Rules
              </button>

              <button
                className="reset-rules-button"
                type="button"
                onClick={
                  handleResetRules
                }
              >
                Reset Defaults
              </button>
            </div>
          </footer>
        </section>
      </section>

      {activeModal &&
        modalConfig && (
          <AddRuleModal
            title={
              modalConfig.title
            }

            description={
              modalConfig
                .description
            }

            options={
              modalConfig.options
            }

            placeholder={
              modalConfig
                .placeholder
            }

            onClose={() =>
              setActiveModal(
                null,
              )
            }

            onAdd={(
              value,
            ) =>
              addRule(
                activeModal,
                value,
              )
            }
          />
        )}
    </DashboardLayout>
  );
}

export default RulesAllowlistPage;