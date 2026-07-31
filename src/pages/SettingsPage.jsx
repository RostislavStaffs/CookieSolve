import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import "./SettingsPage.css";

const defaultSettings = {
  browser: "chromium",
  waitTime: 3000,
  sourceFolder: "./src",
  reportFormats: ["html"],
};

const browserOptions = [
  {
    value: "chromium",
    label: "Chrome",
  },
  {
    value: "firefox",
    label: "Firefox",
  },
  {
    value: "webkit",
    label: "WebKit",
  },
];

function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedSettings = window.localStorage.getItem(
      "cookiesolve-settings",
    );

    if (!savedSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(savedSettings);

      setSettings({
        ...defaultSettings,
        ...parsedSettings,
      });
    } catch {
      window.localStorage.removeItem("cookiesolve-settings");
    }
  }, []);

  const updateSetting = (name, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));
  };

  const updateWaitTime = (value) => {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return;
    }

    updateSetting(
      "waitTime",
      Math.min(Math.max(parsedValue, 0), 30000),
    );
  };

  const adjustWaitTime = (amount) => {
    updateWaitTime(settings.waitTime + amount);
  };

  const toggleReportFormat = (format) => {
    setSettings((currentSettings) => {
      const isSelected =
        currentSettings.reportFormats.includes(format);

      if (isSelected) {
        if (currentSettings.reportFormats.length === 1) {
          return currentSettings;
        }

        return {
          ...currentSettings,
          reportFormats: currentSettings.reportFormats.filter(
            (selectedFormat) => selectedFormat !== format,
          ),
        };
      }

      return {
        ...currentSettings,
        reportFormats: [
          ...currentSettings.reportFormats,
          format,
        ],
      };
    });
  };

  const handleSaveSettings = () => {
    window.localStorage.setItem(
      "cookiesolve-settings",
      JSON.stringify(settings),
    );

    setSavedMessage("Settings saved successfully");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2000);
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    window.localStorage.removeItem("cookiesolve-settings");

    setSavedMessage("Default settings restored");

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2000);
  };

  return (
    <DashboardLayout activePage="Settings" title="Settings">
      <section className="settings-page">
        <header className="settings-heading">
          <h1>Settings</h1>

          <p>Configure settings</p>
        </header>

        <section className="settings-panel">
          <div className="settings-form">
            <div className="settings-field">
              <label htmlFor="settings-browser">
                Browser
              </label>

              <div className="settings-select-wrapper">
                <select
                  id="settings-browser"
                  value={settings.browser}
                  onChange={(event) =>
                    updateSetting(
                      "browser",
                      event.target.value,
                    )
                  }
                >
                  {browserOptions.map((browser) => (
                    <option
                      value={browser.value}
                      key={browser.value}
                    >
                      {browser.label}
                    </option>
                  ))}
                </select>

                <span
                  className="settings-select-arrow"
                  aria-hidden="true"
                />
              </div>

              <p className="settings-field-help">
                Browser engine used by Playwright during runtime
                testing.
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-wait-time">
                Default wait time after reject
              </label>

              <div className="wait-time-control">
                <button
                  type="button"
                  aria-label="Decrease wait time"
                  onClick={() => adjustWaitTime(-500)}
                >
                  −
                </button>

                <div className="wait-time-input-wrapper">
                  <input
                    id="settings-wait-time"
                    type="number"
                    min="0"
                    max="30000"
                    step="500"
                    value={settings.waitTime}
                    onChange={(event) =>
                      updateWaitTime(event.target.value)
                    }
                  />

                  <span>ms</span>
                </div>

                <button
                  type="button"
                  aria-label="Increase wait time"
                  onClick={() => adjustWaitTime(500)}
                >
                  +
                </button>
              </div>

              <p className="settings-field-help">
                Time allowed for delayed tracking activity after
                rejection.
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-source-folder">
                Default source code folder
              </label>

              <div className="source-folder-input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3 6.5h7l2 2h9v10H3z" />
                </svg>

                <input
                  id="settings-source-folder"
                  type="text"
                  value={settings.sourceFolder}
                  placeholder="./src"
                  onChange={(event) =>
                    updateSetting(
                      "sourceFolder",
                      event.target.value,
                    )
                  }
                />
              </div>

              <p className="settings-field-help">
                Default folder scanned during static source-code
                analysis.
              </p>
            </div>

            <fieldset className="settings-field report-format-field">
              <legend>Report format</legend>

              <div className="report-format-options">
                <button
                  className={
                    settings.reportFormats.includes("html")
                      ? "report-format-option selected"
                      : "report-format-option"
                  }
                  type="button"
                  aria-pressed={settings.reportFormats.includes(
                    "html",
                  )}
                  onClick={() => toggleReportFormat("html")}
                >
                  <span className="report-format-icon">
                    &lt;/&gt;
                  </span>

                  <span>
                    <strong>HTML</strong>
                    <small>Readable browser report</small>
                  </span>

                  <span
                    className="report-format-check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </button>

                <button
                  className={
                    settings.reportFormats.includes("json")
                      ? "report-format-option selected"
                      : "report-format-option"
                  }
                  type="button"
                  aria-pressed={settings.reportFormats.includes(
                    "json",
                  )}
                  onClick={() => toggleReportFormat("json")}
                >
                  <span className="report-format-icon">
                    {"{}"}
                  </span>

                  <span>
                    <strong>JSON</strong>
                    <small>Structured result data</small>
                  </span>

                  <span
                    className="report-format-check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </button>
              </div>

              <p className="settings-field-help">
                At least one report format must remain selected.
              </p>
            </fieldset>
          </div>

          <footer className="settings-footer">
            <div
              className="settings-save-message"
              aria-live="polite"
            >
              {savedMessage}
            </div>

            <div className="settings-actions">
              <button
                className="reset-settings-button"
                type="button"
                onClick={handleResetSettings}
              >
                Reset Defaults
              </button>

              <button
                className="save-settings-button"
                type="button"
                onClick={handleSaveSettings}
              >
                Save Settings
              </button>
            </div>
          </footer>
        </section>
      </section>
    </DashboardLayout>
  );
}

export default SettingsPage;