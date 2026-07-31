import { useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import AddRuleModal from "../components/AddRuleModal";
import "./RulesAllowlistPage.css";

const modalConfigurations = {
  cookies: {
    title: "Add Necessary Cookie",
    description:
      "Choose a common essential cookie or enter the exact cookie name used by your website.",
    placeholder: "Example: session_id",
    options: [
      {
        label: "Session cookie",
        value: "session_id",
        description: "Maintains the user's active authenticated session.",
      },
      {
        label: "CSRF token",
        value: "csrf_token",
        description: "Protects forms and requests against CSRF attacks.",
      },
      {
        label: "Consent preference",
        value: "cookie_consent",
        description: "Stores the user's cookie-consent selection.",
      },
    ],
  },

  domains: {
    title: "Add Ignored Domain",
    description:
      "Requests to ignored domains will remain visible but will not be treated as tracking issues.",
    placeholder: "Example: cdn.example.com",
    options: [
      {
        label: "Local development",
        value: "localhost",
        description: "Ignore requests made to the local development host.",
      },
      {
        label: "Static asset CDN",
        value: "cdn.safe.com",
        description: "Ignore a trusted content-delivery domain.",
      },
      {
        label: "Internal API",
        value: "api.internal",
        description: "Ignore a trusted internal service domain.",
      },
    ],
  },

  keywords: {
    title: "Add Tracking Keyword",
    description:
      "Keywords are matched against script names, request URLs and detected tracking identifiers.",
    placeholder: "Example: analytics",
    options: [
      {
        label: "Analytics",
        value: "analytics",
        description: "Detect common analytics-related resources.",
      },
      {
        label: "Facebook",
        value: "facebook",
        description: "Detect Facebook Pixel and related tracking requests.",
      },
      {
        label: "Advertising",
        value: "advertising",
        description: "Detect advertising and behavioural-marketing patterns.",
      },
    ],
  },

  patterns: {
    title: "Add Source Code Pattern",
    description:
      "Source-code patterns are searched during static analysis to identify potentially ungated tracking logic.",
    placeholder: "Example: document.cookie",
    options: [
      {
        label: "document.cookie",
        value: "document.cookie",
        description: "Detect direct cookie writes in JavaScript.",
      },
      {
        label: "Google tag",
        value: "gtag",
        description: "Detect Google Analytics or Google Tag calls.",
      },
      {
        label: "Facebook queue",
        value: "fbq",
        description: "Detect Facebook Pixel initialisation and events.",
      },
    ],
  },
};

const defaultRules = {
  cookies: ["session_id", "csrf_token"],
  domains: ["localhost", "cdn.safe.com"],
  keywords: ["analytics", "facebook"],
  patterns: ["document.cookie", "gtag", "fbq"],
};

function RulesAllowlistPage() {
  const [rules, setRules] = useState(defaultRules);
  const [activeModal, setActiveModal] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  const modalConfig = useMemo(() => {
    if (!activeModal) {
      return null;
    }

    return modalConfigurations[activeModal];
  }, [activeModal]);

  const addRule = (group, value) => {
    setRules((currentRules) => {
      if (currentRules[group].includes(value)) {
        return currentRules;
      }

      return {
        ...currentRules,
        [group]: [...currentRules[group], value],
      };
    });
  };

  const removeRule = (group, value) => {
    setRules((currentRules) => ({
      ...currentRules,
      [group]: currentRules[group].filter((item) => item !== value),
    }));
  };

  const handleSave = () => {
    setSavedMessage("Rules saved");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 1800);
  };

  const resetRules = () => {
    setRules(defaultRules);
    setSavedMessage("Defaults restored");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 1800);
  };

  const renderRuleGroup = ({
    title,
    group,
    buttonLabel,
  }) => (
    <section className="rules-group">
      <h2>{title}</h2>

      <div className="rules-group-content">
        <div className="rule-chip-list">
          {rules[group].map((rule) => (
            <span className="rule-chip" key={rule}>
              <span>{rule}</span>

              <button
                type="button"
                aria-label={`Remove ${rule}`}
                onClick={() => removeRule(group, rule)}
              >
                ×
              </button>
            </span>
          ))}

          {rules[group].length === 0 && (
            <span className="empty-rule-message">
              No values added
            </span>
          )}
        </div>

        <button
          className="add-rule-button"
          type="button"
          onClick={() => setActiveModal(group)}
        >
          <span aria-hidden="true">+</span>
          {buttonLabel}
        </button>
      </div>
    </section>
  );

  return (
    <DashboardLayout
      activePage="Rules & Allowlist"
      title="Rules & Allowlist"
    >
      <section className="rules-page">
        <header className="rules-page-heading">
          <h1>Rules & Allowlist</h1>
          <p>Configure your rules</p>
        </header>

        <section className="rules-panel">
          <div className="rules-panel-content">
            {renderRuleGroup({
              title: "Necessary Cookies",
              group: "cookies",
              buttonLabel: "Add Cookie",
            })}

            {renderRuleGroup({
              title: "Ignored Domains",
              group: "domains",
              buttonLabel: "Add Domain",
            })}

            {renderRuleGroup({
              title: "Tracking Keywords",
              group: "keywords",
              buttonLabel: "Add Keyword",
            })}

            {renderRuleGroup({
              title: "Source Code Patterns",
              group: "patterns",
              buttonLabel: "Add Pattern",
            })}
          </div>

          <footer className="rules-panel-footer">
            <div className="rules-save-message" aria-live="polite">
              {savedMessage}
            </div>

            <div className="rules-footer-actions">
              <button
                className="save-rules-button"
                type="button"
                onClick={handleSave}
              >
                Save Rules
              </button>

              <button
                className="reset-rules-button"
                type="button"
                onClick={resetRules}
              >
                Reset Defaults
              </button>
            </div>
          </footer>
        </section>
      </section>

      {activeModal && modalConfig && (
        <AddRuleModal
          title={modalConfig.title}
          description={modalConfig.description}
          options={modalConfig.options}
          placeholder={modalConfig.placeholder}
          onClose={() => setActiveModal(null)}
          onAdd={(value) => addRule(activeModal, value)}
        />
      )}
    </DashboardLayout>
  );
}

export default RulesAllowlistPage;