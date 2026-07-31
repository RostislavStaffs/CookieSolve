import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import ScanProgressModal from "../components/ScanProgressModal";
import "./NewScanPage.css";

const necessaryCookieOptions = [
  {
    name: "session_id",
    description: "Maintains the active user session",
  },
  {
    name: "csrf_token",
    description: "Protects forms against CSRF attacks",
  },
  {
    name: "auth_token",
    description: "Maintains authenticated access",
  },
  {
    name: "cookie_consent",
    description: "Stores the user's consent choice",
  },
  {
    name: "language",
    description: "Stores the selected language",
  },
  {
    name: "load_balancer",
    description: "Maintains server routing",
  },
];

function NewScanPage() {
  const navigate = useNavigate();
  const allowlistRef = useRef(null);

  const [targetUrl, setTargetUrl] = useState(
    "http://localhost:3000",
  );

  const [isScanRunning, setIsScanRunning] = useState(false);
  const [isAllowlistOpen, setIsAllowlistOpen] = useState(false);
  const [allowlistSearch, setAllowlistSearch] = useState("");

  const [selectedCookies, setSelectedCookies] = useState([
    "session_id",
    "csrf_token",
  ]);

  useEffect(() => {
    const closeDropdown = (event) => {
      if (
        allowlistRef.current &&
        !allowlistRef.current.contains(event.target)
      ) {
        setIsAllowlistOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isScanRunning ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isScanRunning]);

  const filteredCookieOptions = necessaryCookieOptions.filter(
    (cookie) => {
      const searchValue = allowlistSearch.toLowerCase();

      return (
        cookie.name.toLowerCase().includes(searchValue) ||
        cookie.description.toLowerCase().includes(searchValue)
      );
    },
  );

  const toggleCookie = (cookieName) => {
    setSelectedCookies((currentCookies) => {
      if (currentCookies.includes(cookieName)) {
        return currentCookies.filter(
          (cookie) => cookie !== cookieName,
        );
      }

      return [...currentCookies, cookieName];
    });
  };

  const removeCookie = (cookieName) => {
    setSelectedCookies((currentCookies) =>
      currentCookies.filter(
        (cookie) => cookie !== cookieName,
      ),
    );
  };

  const addCustomCookie = () => {
    const cookieName = allowlistSearch.trim();

    if (!cookieName || selectedCookies.includes(cookieName)) {
      return;
    }

    setSelectedCookies((currentCookies) => [
      ...currentCookies,
      cookieName,
    ]);

    setAllowlistSearch("");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomCookie();
    }

    if (event.key === "Escape") {
      setIsAllowlistOpen(false);
    }
  };

  const handleRunScan = () => {
    setIsAllowlistOpen(false);
    setIsScanRunning(true);
  };

  const handleScanComplete = useCallback(() => {
    setIsScanRunning(false);
    navigate("/scan-results");
  }, [navigate]);

  return (
    <DashboardLayout activePage="New Scan" title="New Scan">
      <section className="new-scan-page">
        <h1>Setup Scan</h1>

        <form className="scan-setup-card">
          <div className="scan-field">
            <label htmlFor="target-website">
              Target Website
            </label>

            <input
              id="target-website"
              name="targetWebsite"
              type="url"
              value={targetUrl}
              placeholder="http://localhost:3000"
              onChange={(event) =>
                setTargetUrl(event.target.value)
              }
            />
          </div>

          <fieldset className="scan-option-group consent-action-group">
            <legend>Consent Action</legend>

            <label className="scan-radio-option">
              <input
                type="radio"
                name="consentAction"
                value="accept"
              />

              <span
                className="custom-radio"
                aria-hidden="true"
              />

              <span>Accept all</span>
            </label>

            <label className="scan-radio-option">
              <input
                type="radio"
                name="consentAction"
                value="reject"
                defaultChecked
              />

              <span
                className="custom-radio"
                aria-hidden="true"
              />

              <span>Reject all</span>
            </label>
          </fieldset>

          <div className="scan-field">
            <label htmlFor="source-folder">
              Source Code Folder
            </label>

            <input
              id="source-folder"
              name="sourceFolder"
              type="text"
              defaultValue="./src"
              placeholder="./src"
            />
          </div>

          <div
            className="cookie-allowlist-field"
            ref={allowlistRef}
          >
            <label id="cookie-allowlist-label">
              Necessary Cookie Allowlist
            </label>

            <button
              className={`cookie-allowlist-trigger ${
                isAllowlistOpen ? "open" : ""
              }`}
              type="button"
              aria-labelledby="cookie-allowlist-label"
              aria-haspopup="listbox"
              aria-expanded={isAllowlistOpen}
              onClick={() =>
                setIsAllowlistOpen((current) => !current)
              }
            >
              <span className="selected-cookie-preview">
                {selectedCookies.length === 0 ? (
                  <span className="allowlist-placeholder">
                    Select necessary cookies
                  </span>
                ) : (
                  selectedCookies
                    .slice(0, 2)
                    .map((cookieName) => (
                      <span
                        className="selected-cookie-chip"
                        key={cookieName}
                      >
                        {cookieName}

                        <span
                          className="selected-cookie-remove"
                          role="button"
                          tabIndex="0"
                          aria-label={`Remove ${cookieName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeCookie(cookieName);
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              event.stopPropagation();
                              removeCookie(cookieName);
                            }
                          }}
                        >
                          ×
                        </span>
                      </span>
                    ))
                )}

                {selectedCookies.length > 2 && (
                  <span className="selected-cookie-count">
                    +{selectedCookies.length - 2}
                  </span>
                )}
              </span>

              <span
                className="allowlist-arrow"
                aria-hidden="true"
              />
            </button>

            {isAllowlistOpen && (
              <div className="cookie-allowlist-menu">
                <div className="allowlist-search-wrapper">
                  <svg
                    className="allowlist-search-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                  </svg>

                  <input
                    type="text"
                    value={allowlistSearch}
                    placeholder="Search or add a cookie"
                    aria-label="Search or add a necessary cookie"
                    onChange={(event) =>
                      setAllowlistSearch(event.target.value)
                    }
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>

                <div
                  className="cookie-option-list"
                  role="listbox"
                  aria-multiselectable="true"
                >
                  {filteredCookieOptions.map((cookie) => {
                    const isSelected =
                      selectedCookies.includes(cookie.name);

                    return (
                      <button
                        className={`cookie-option ${
                          isSelected ? "selected" : ""
                        }`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        key={cookie.name}
                        onClick={() =>
                          toggleCookie(cookie.name)
                        }
                      >
                        <span className="cookie-option-check">
                          {isSelected && (
                            <svg
                              viewBox="0 0 16 16"
                              aria-hidden="true"
                            >
                              <path d="m3 8.2 3 3L13 4.8" />
                            </svg>
                          )}
                        </span>

                        <span className="cookie-option-text">
                          <strong>{cookie.name}</strong>
                          <small>{cookie.description}</small>
                        </span>
                      </button>
                    );
                  })}

                  {filteredCookieOptions.length === 0 &&
                    allowlistSearch.trim() && (
                      <button
                        className="add-custom-cookie-button"
                        type="button"
                        onClick={addCustomCookie}
                      >
                        <span className="add-custom-cookie-icon">
                          +
                        </span>

                        <span>
                          Add
                          <strong>
                            “{allowlistSearch.trim()}”
                          </strong>
                        </span>
                      </button>
                    )}
                </div>

                <div className="allowlist-menu-footer">
                  <span>
                    {selectedCookies.length} selected
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedCookies([])}
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          <fieldset className="scan-option-group scan-options-group">
            <legend>Scan Options</legend>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkCookies"
                defaultChecked
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>Check cookies</span>
            </label>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkNetworkRequests"
                defaultChecked
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>Check network requests</span>
            </label>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkStorage"
                defaultChecked
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>
                Check localStorage/sessionStorage
              </span>
            </label>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="scanSourceCode"
                defaultChecked
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>Scan source code</span>
            </label>
          </fieldset>

          <div className="scan-form-actions">
            <button
              className="scan-action-button"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button
              className="scan-action-button"
              type="button"
              onClick={handleRunScan}
            >
              Run Scan
            </button>
          </div>
        </form>
      </section>

      {isScanRunning && (
        <ScanProgressModal
          targetUrl={targetUrl}
          onCancel={() => setIsScanRunning(false)}
          onComplete={handleScanComplete}
        />
      )}
    </DashboardLayout>
  );
}

export default NewScanPage;