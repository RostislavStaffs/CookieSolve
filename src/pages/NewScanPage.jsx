import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import ScanProgressModal from "../components/ScanProgressModal";
import {
  startScan,
} from "../services/scanApi";

import "./NewScanPage.css";

const necessaryCookieOptions = [
  {
    name: "session_id",
    description:
      "Maintains the active user session",
  },
  {
    name: "csrf_token",
    description:
      "Protects forms against CSRF attacks",
  },
  {
    name: "auth_token",
    description:
      "Maintains authenticated access",
  },
  {
    name: "cookie_consent",
    description:
      "Stores the user's consent choice",
  },
  {
    name: "language",
    description:
      "Stores the selected language",
  },
  {
    name: "load_balancer",
    description:
      "Maintains server routing",
  },
];

const defaultScanSettings = {
  browser: "chromium",
  waitTime: 3000,
  sourceFolder: "",
};

function getScanMode({
  hasRuntimeChecks,
  hasSourceCodeCheck,
}) {
  if (
    hasRuntimeChecks &&
    hasSourceCodeCheck
  ) {
    return {
      value: "hybrid",
      label:
        "Hybrid runtime and source-code analysis",
    };
  }

  if (hasRuntimeChecks) {
    return {
      value: "runtime",
      label:
        "Runtime browser analysis",
    };
  }

  return {
    value: "source-code",
    label:
      "Static source-code analysis",
  };
}

function NewScanPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const allowlistRef =
    useRef(null);

  const routerStateAppliedRef =
    useRef(false);

  const [
    targetUrl,
    setTargetUrl,
  ] = useState(
    "http://localhost:3000",
  );

  const [
    consentAction,
    setConsentAction,
  ] = useState("reject");

  const [
    acceptSelector,
    setAcceptSelector,
  ] = useState(
    "#accept-all",
  );

  const [
    rejectSelector,
    setRejectSelector,
  ] = useState(
    "#reject-all",
  );

  const [
    sourceFolder,
    setSourceFolder,
  ] = useState(
    defaultScanSettings
      .sourceFolder,
  );

  const [
    browser,
    setBrowser,
  ] = useState(
    defaultScanSettings
      .browser,
  );

  const [
    waitTime,
    setWaitTime,
  ] = useState(
    defaultScanSettings
      .waitTime,
  );

  const [
    scanOptions,
    setScanOptions,
  ] = useState({
    checkCookies: true,
    checkNetworkRequests:
      true,
    checkStorage: true,
    scanSourceCode: false,
  });

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isScanRunning,
    setIsScanRunning,
  ] = useState(false);

  const [
    activeScanId,
    setActiveScanId,
  ] = useState(null);

  const [
    activeTargetUrl,
    setActiveTargetUrl,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isAllowlistOpen,
    setIsAllowlistOpen,
  ] = useState(false);

  const [
    allowlistSearch,
    setAllowlistSearch,
  ] = useState("");

  const [
    selectedCookies,
    setSelectedCookies,
  ] = useState([
    "session_id",
    "csrf_token",
  ]);

  const [
    necessaryStorageAllowlist,
    setNecessaryStorageAllowlist,
  ] = useState(
    "site_consent",
  );

  const hasRuntimeChecks =
    scanOptions.checkCookies ||
    scanOptions
      .checkNetworkRequests ||
    scanOptions.checkStorage;

  const hasSourceCodeCheck =
    scanOptions.scanSourceCode;

  const scanMode =
    useMemo(
      () =>
        getScanMode({
          hasRuntimeChecks,
          hasSourceCodeCheck,
        }),
      [
        hasRuntimeChecks,
        hasSourceCodeCheck,
      ],
    );

  useEffect(() => {
    const savedSettings =
      window.localStorage.getItem(
        "cookiesolve-settings",
      );

    if (!savedSettings) {
      return;
    }

    try {
      const parsedSettings =
        JSON.parse(
          savedSettings,
        );

      if (
        [
          "chromium",
          "firefox",
          "webkit",
        ].includes(
          parsedSettings.browser,
        )
      ) {
        setBrowser(
          parsedSettings
            .browser,
        );
      }

      if (
        Number.isFinite(
          Number(
            parsedSettings
              .waitTime,
          ),
        )
      ) {
        setWaitTime(
          Number(
            parsedSettings
              .waitTime,
          ),
        );
      }

      if (
        typeof parsedSettings
          .sourceFolder ===
        "string"
      ) {
        setSourceFolder(
          parsedSettings
            .sourceFolder,
        );
      }
    } catch {
      /*
       * Invalid settings are
       * safely ignored.
       */
    }
  }, []);

  useEffect(() => {
    if (
      routerStateAppliedRef
        .current ||
      !location.state
    ) {
      return;
    }

    routerStateAppliedRef
      .current = true;

    const previousScan =
      location.state;

    if (
      typeof previousScan
        .targetUrl ===
      "string"
    ) {
      setTargetUrl(
        previousScan
          .targetUrl,
      );
    }

    if (
      previousScan
        .consentAction ===
        "accept" ||
      previousScan
        .consentAction ===
        "reject"
    ) {
      setConsentAction(
        previousScan
          .consentAction,
      );
    }

    if (
      typeof previousScan
        .acceptSelector ===
        "string" &&
      previousScan
        .acceptSelector
        .trim()
    ) {
      setAcceptSelector(
        previousScan
          .acceptSelector,
      );
    }

    if (
      typeof previousScan
        .rejectSelector ===
        "string" &&
      previousScan
        .rejectSelector
        .trim()
    ) {
      setRejectSelector(
        previousScan
          .rejectSelector,
      );
    }

    if (
      [
        "chromium",
        "firefox",
        "webkit",
      ].includes(
        previousScan.browser,
      )
    ) {
      setBrowser(
        previousScan.browser,
      );
    }

    if (
      Number.isFinite(
        Number(
          previousScan
            .waitTime,
        ),
      )
    ) {
      setWaitTime(
        Number(
          previousScan
            .waitTime,
        ),
      );
    }

    if (
      typeof previousScan
        .sourceFolder ===
      "string"
    ) {
      setSourceFolder(
        previousScan
          .sourceFolder,
      );
    }

    if (
      Array.isArray(
        previousScan
          .necessaryCookieAllowlist,
      )
    ) {
      setSelectedCookies(
        previousScan
          .necessaryCookieAllowlist
          .map((cookie) =>
            String(cookie)
              .trim(),
          )
          .filter(Boolean),
      );
    }

    if (
      Array.isArray(
        previousScan
          .necessaryStorageAllowlist,
      )
    ) {
      setNecessaryStorageAllowlist(
        previousScan
          .necessaryStorageAllowlist
          .map((item) =>
            String(item)
              .trim(),
          )
          .filter(Boolean)
          .join(", "),
      );
    }

    if (
      previousScan
        .scanOptions &&
      typeof previousScan
        .scanOptions ===
        "object"
    ) {
      setScanOptions({
        checkCookies:
          previousScan
            .scanOptions
            .cookies ??
          previousScan
            .scanOptions
            .checkCookies ??
          true,

        checkNetworkRequests:
          previousScan
            .scanOptions
            .networkRequests ??
          previousScan
            .scanOptions
            .checkNetworkRequests ??
          true,

        checkStorage:
          previousScan
            .scanOptions
            .browserStorage ??
          previousScan
            .scanOptions
            .checkStorage ??
          true,

        scanSourceCode:
          previousScan
            .scanOptions
            .sourceCode ??
          previousScan
            .scanOptions
            .scanSourceCode ??
          false,
      });
    }

    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      },
    );
  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (
      !hasRuntimeChecks
    ) {
      setIsAllowlistOpen(
        false,
      );
    }
  }, [hasRuntimeChecks]);

  useEffect(() => {
    function closeDropdown(
      event,
    ) {
      if (
        allowlistRef.current &&
        !allowlistRef.current
          .contains(
            event.target,
          )
      ) {
        setIsAllowlistOpen(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      closeDropdown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeDropdown,
      );
    };
  }, []);

  useEffect(() => {
    document.body.style
      .overflow =
      isScanRunning
        ? "hidden"
        : "";

    return () => {
      document.body.style
        .overflow = "";
    };
  }, [isScanRunning]);

  const filteredCookieOptions =
    necessaryCookieOptions
      .filter((cookie) => {
        const searchValue =
          allowlistSearch
            .trim()
            .toLowerCase();

        return (
          cookie.name
            .toLowerCase()
            .includes(
              searchValue,
            ) ||
          cookie.description
            .toLowerCase()
            .includes(
              searchValue,
            )
        );
      });

  function toggleCookie(
    cookieName,
  ) {
    setSelectedCookies(
      (currentCookies) => {
        if (
          currentCookies.includes(
            cookieName,
          )
        ) {
          return currentCookies
            .filter(
              (cookie) =>
                cookie !==
                cookieName,
            );
        }

        return [
          ...currentCookies,
          cookieName,
        ];
      },
    );
  }

  function removeCookie(
    cookieName,
  ) {
    setSelectedCookies(
      (currentCookies) =>
        currentCookies.filter(
          (cookie) =>
            cookie !==
            cookieName,
        ),
    );
  }

  function addCustomCookie() {
    const cookieName =
      allowlistSearch.trim();

    if (
      !cookieName ||
      selectedCookies.includes(
        cookieName,
      )
    ) {
      return;
    }

    setSelectedCookies(
      (currentCookies) => [
        ...currentCookies,
        cookieName,
      ],
    );

    setAllowlistSearch("");
  }

  function handleSearchKeyDown(
    event,
  ) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
      addCustomCookie();
    }

    if (
      event.key === "Escape"
    ) {
      setIsAllowlistOpen(
        false,
      );
    }
  }

  function updateScanOption(
    event,
  ) {
    const {
      name,
      checked,
    } = event.target;

    setScanOptions(
      (currentOptions) => ({
        ...currentOptions,
        [name]: checked,
      }),
    );

    setErrorMessage("");
  }

  async function handleRunScan(
    event,
  ) {
    event.preventDefault();

    const cleanedTargetUrl =
      targetUrl.trim();

    const cleanedAcceptSelector =
      acceptSelector.trim();

    const cleanedRejectSelector =
      rejectSelector.trim();

    const cleanedSourceFolder =
      sourceFolder.trim();

    const parsedStorageAllowlist =
      necessaryStorageAllowlist
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);

    const selectedConsentSelector =
      consentAction ===
      "accept"
        ? cleanedAcceptSelector
        : cleanedRejectSelector;

    const atLeastOneOptionSelected =
      hasRuntimeChecks ||
      hasSourceCodeCheck;

    if (
      !atLeastOneOptionSelected
    ) {
      setErrorMessage(
        "Select at least one scan option.",
      );

      return;
    }

    if (
      hasRuntimeChecks &&
      !cleanedTargetUrl
    ) {
      setErrorMessage(
        "Enter the website URL for runtime scanning.",
      );

      return;
    }

    if (
      hasRuntimeChecks &&
      !selectedConsentSelector
    ) {
      setErrorMessage(
        consentAction ===
        "accept"
          ? "Enter the CSS selector for the Accept All button."
          : "Enter the CSS selector for the Reject All button.",
      );

      return;
    }

    if (
      hasSourceCodeCheck &&
      !cleanedSourceFolder
    ) {
      setErrorMessage(
        "Enter the source-code folder to analyse.",
      );

      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data =
        await startScan({
          targetUrl:
            hasRuntimeChecks
              ? cleanedTargetUrl
              : "",

          consentAction,

          acceptSelector:
            cleanedAcceptSelector,

          rejectSelector:
            cleanedRejectSelector,

          browser,

          waitTime:
            Number(waitTime),

          necessaryCookieAllowlist:
            selectedCookies,

          necessaryStorageAllowlist:
            parsedStorageAllowlist,

          sourceCodeFolder:
            hasSourceCodeCheck
              ? cleanedSourceFolder
              : "",

          scanOptions: {
            cookies:
              scanOptions
                .checkCookies,

            networkRequests:
              scanOptions
                .checkNetworkRequests,

            browserStorage:
              scanOptions
                .checkStorage,

            sourceCode:
              scanOptions
                .scanSourceCode,
          },
        });

      const createdScanId =
        data?.scan?._id ??
        data?.scan?.id;

      if (
        !createdScanId
      ) {
        throw new Error(
          "The server created the scan but did not return its ID.",
        );
      }

      setActiveScanId(
        createdScanId,
      );

      setActiveTargetUrl(
        hasRuntimeChecks
          ? cleanedTargetUrl
          : `Source: ${cleanedSourceFolder}`,
      );

      setIsScanRunning(
        true,
      );
    } catch (error) {
      console.error(
        "Unable to start scan:",
        error,
      );

      setErrorMessage(
        error.message ||
          "Unable to start the scan.",
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  const handleScanComplete =
    useCallback(
      (
        completedScanId,
      ) => {
        setIsScanRunning(
          false,
        );

        setActiveScanId(
          null,
        );

        navigate(
          `/scan-results?scan=${completedScanId}`,
        );
      },
      [navigate],
    );

  const handleCloseProgress =
    useCallback(() => {
      setIsScanRunning(
        false,
      );

      setActiveScanId(
        null,
      );
    }, []);

  return (
    <DashboardLayout
      activePage="New Scan"
      title="New Scan"
    >
      <section className="new-scan-page">
        <h1>
          Setup Scan
        </h1>

        <form
          className="scan-setup-card"
          onSubmit={
            handleRunScan
          }
        >
          <div className="scan-mode-display">
            <span>
              Scan mode
            </span>

            <strong>
              {scanMode.label}
            </strong>
          </div>

          <div className="scan-field">
            <label htmlFor="target-website">
              Target Website

              {!hasRuntimeChecks && (
                <span>
                  {" "}
                  (not required)
                </span>
              )}
            </label>

            <input
              id="target-website"
              name="targetWebsite"
              type="url"
              value={targetUrl}
              placeholder="http://localhost:3000"
              required={
                hasRuntimeChecks
              }
              disabled={
                !hasRuntimeChecks
              }
              onChange={(
                event,
              ) => {
                setTargetUrl(
                  event.target
                    .value,
                );

                setErrorMessage(
                  "",
                );
              }}
            />

            {!hasRuntimeChecks && (
              <small className="scan-field-help">
                Runtime browser testing is disabled, so no website URL is required.
              </small>
            )}
          </div>

          {hasRuntimeChecks && (
            <>
              <fieldset className="scan-option-group consent-action-group">
                <legend>
                  Consent Action
                </legend>

                <label className="scan-radio-option">
                  <input
                    type="radio"
                    name="consentAction"
                    value="accept"
                    checked={
                      consentAction ===
                      "accept"
                    }
                    onChange={(
                      event,
                    ) => {
                      setConsentAction(
                        event.target
                          .value,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                  />

                  <span
                    className="custom-radio"
                    aria-hidden="true"
                  />

                  <span>
                    Accept all
                  </span>
                </label>

                <label className="scan-radio-option">
                  <input
                    type="radio"
                    name="consentAction"
                    value="reject"
                    checked={
                      consentAction ===
                      "reject"
                    }
                    onChange={(
                      event,
                    ) => {
                      setConsentAction(
                        event.target
                          .value,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                  />

                  <span
                    className="custom-radio"
                    aria-hidden="true"
                  />

                  <span>
                    Reject all
                  </span>
                </label>
              </fieldset>

              <div className="scan-field">
                <label htmlFor="consent-button-selector">
                  {consentAction ===
                  "accept"
                    ? "Accept Button Selector"
                    : "Reject Button Selector"}
                </label>

                <input
                  id="consent-button-selector"
                  name="consentButtonSelector"
                  type="text"
                  value={
                    consentAction ===
                    "accept"
                      ? acceptSelector
                      : rejectSelector
                  }
                  placeholder={
                    consentAction ===
                    "accept"
                      ? "#accept-all"
                      : "#reject-all"
                  }
                  required
                  onChange={(
                    event,
                  ) => {
                    if (
                      consentAction ===
                      "accept"
                    ) {
                      setAcceptSelector(
                        event.target
                          .value,
                      );
                    } else {
                      setRejectSelector(
                        event.target
                          .value,
                      );
                    }

                    setErrorMessage(
                      "",
                    );
                  }}
                />

                <small className="scan-field-help">
                  Enter the CSS selector used to identify the website’s{" "}
                  {consentAction ===
                  "accept"
                    ? "Accept All"
                    : "Reject All"}{" "}
                  button.
                </small>
              </div>
            </>
          )}

          <div className="scan-field">
            <label htmlFor="source-folder">
              Source Code Folder

              {!hasSourceCodeCheck && (
                <span>
                  {" "}
                  (not required)
                </span>
              )}
            </label>

            <input
              id="source-folder"
              name="sourceFolder"
              type="text"
              value={
                sourceFolder
              }
              placeholder="Select source folder (e.g., src/)"
              required={
                hasSourceCodeCheck
              }
              disabled={
                !hasSourceCodeCheck
              }
              onChange={(
                event,
              ) => {
                setSourceFolder(
                  event.target
                    .value,
                );

                setErrorMessage(
                  "",
                );
              }}
            />

            <small className="scan-field-help">
              Enter a folder relative to the configured source-code root.
            </small>
          </div>

          <div
            className="cookie-allowlist-field"
            ref={allowlistRef}
          >
            <label id="cookie-allowlist-label">
              Necessary Cookie Allowlist
            </label>

            <button
              className={[
                "cookie-allowlist-trigger",

                isAllowlistOpen
                  ? "open"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              aria-labelledby="cookie-allowlist-label"
              aria-haspopup="listbox"
              aria-expanded={
                isAllowlistOpen
              }
              disabled={
                !scanOptions
                  .checkCookies
              }
              onClick={() =>
                setIsAllowlistOpen(
                  (current) =>
                    !current,
                )
              }
            >
              <span className="selected-cookie-preview">
                {selectedCookies
                  .length === 0 ? (
                  <span className="allowlist-placeholder">
                    Select necessary cookies
                  </span>
                ) : (
                  selectedCookies
                    .slice(0, 2)
                    .map(
                      (
                        cookieName,
                      ) => (
                        <span
                          className="selected-cookie-chip"
                          key={
                            cookieName
                          }
                        >
                          {
                            cookieName
                          }

                          <span
                            className="selected-cookie-remove"
                            role="button"
                            tabIndex="0"
                            aria-label={`Remove ${cookieName}`}
                            onClick={(
                              event,
                            ) => {
                              event
                                .stopPropagation();

                              removeCookie(
                                cookieName,
                              );
                            }}
                            onKeyDown={(
                              event,
                            ) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event
                                  .preventDefault();

                                event
                                  .stopPropagation();

                                removeCookie(
                                  cookieName,
                                );
                              }
                            }}
                          >
                            ×
                          </span>
                        </span>
                      ),
                    )
                )}

                {selectedCookies
                  .length >
                  2 && (
                  <span className="selected-cookie-count">
                    +
                    {selectedCookies
                      .length -
                      2}
                  </span>
                )}
              </span>

              <span
                className="allowlist-arrow"
                aria-hidden="true"
              />
            </button>

            {isAllowlistOpen &&
              scanOptions
                .checkCookies && (
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
                      value={
                        allowlistSearch
                      }
                      placeholder="Search or add a cookie"
                      aria-label="Search or add a necessary cookie"
                      onChange={(
                        event,
                      ) =>
                        setAllowlistSearch(
                          event
                            .target
                            .value,
                        )
                      }
                      onKeyDown={
                        handleSearchKeyDown
                      }
                    />
                  </div>

                  <div
                    className="cookie-option-list"
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    {filteredCookieOptions
                      .map(
                        (
                          cookie,
                        ) => {
                          const isSelected =
                            selectedCookies.includes(
                              cookie.name,
                            );

                          return (
                            <button
                              className={[
                                "cookie-option",

                                isSelected
                                  ? "selected"
                                  : "",
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " ",
                                )}
                              type="button"
                              role="option"
                              aria-selected={
                                isSelected
                              }
                              key={
                                cookie.name
                              }
                              onClick={() =>
                                toggleCookie(
                                  cookie.name,
                                )
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
                                <strong>
                                  {
                                    cookie.name
                                  }
                                </strong>

                                <small>
                                  {
                                    cookie.description
                                  }
                                </small>
                              </span>
                            </button>
                          );
                        },
                      )}

                    {filteredCookieOptions
                      .length ===
                      0 &&
                      allowlistSearch
                        .trim() && (
                        <button
                          className="add-custom-cookie-button"
                          type="button"
                          onClick={
                            addCustomCookie
                          }
                        >
                          <span className="add-custom-cookie-icon">
                            +
                          </span>

                          <span>
                            Add{" "}
                            <strong>
                              “
                              {allowlistSearch
                                .trim()}
                              ”
                            </strong>
                          </span>
                        </button>
                      )}
                  </div>

                  <div className="allowlist-menu-footer">
                    <span>
                      {
                        selectedCookies
                          .length
                      }{" "}
                      selected
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCookies(
                          [],
                        )
                      }
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="scan-field">
            <label htmlFor="storage-allowlist">
              Necessary Storage Allowlist
            </label>

            <input
              id="storage-allowlist"
              name="storageAllowlist"
              type="text"
              value={
                necessaryStorageAllowlist
              }
              placeholder="site_consent, consent_preferences"
              disabled={
                !scanOptions
                  .checkStorage
              }
              onChange={(
                event,
              ) => {
                setNecessaryStorageAllowlist(
                  event.target
                    .value,
                );

                setErrorMessage(
                  "",
                );
              }}
            />

            <small className="scan-field-help">
              Enter necessary localStorage or sessionStorage keys separated by commas.
            </small>
          </div>

          <fieldset className="scan-option-group scan-options-group">
            <legend>
              Scan Options
            </legend>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkCookies"
                checked={
                  scanOptions
                    .checkCookies
                }
                onChange={
                  updateScanOption
                }
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>
                Check cookies
              </span>
            </label>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkNetworkRequests"
                checked={
                  scanOptions
                    .checkNetworkRequests
                }
                onChange={
                  updateScanOption
                }
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>
                Check network requests
              </span>
            </label>

            <label className="scan-checkbox-option">
              <input
                type="checkbox"
                name="checkStorage"
                checked={
                  scanOptions
                    .checkStorage
                }
                onChange={
                  updateScanOption
                }
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
                checked={
                  scanOptions
                    .scanSourceCode
                }
                onChange={
                  updateScanOption
                }
              />

              <span
                className="custom-checkbox"
                aria-hidden="true"
              />

              <span>
                Scan source code
              </span>
            </label>
          </fieldset>

          {errorMessage && (
            <p
              className="scan-form-error"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className="scan-form-actions">
            <button
              className="scan-action-button"
              type="button"
              disabled={
                isSubmitting
              }
              onClick={() =>
                navigate(
                  "/dashboard",
                )
              }
            >
              Cancel
            </button>

            <button
              className="scan-action-button"
              type="submit"
              disabled={
                isSubmitting ||
                isScanRunning
              }
            >
              {isSubmitting
                ? "Starting Scan..."
                : "Run Scan"}
            </button>
          </div>
        </form>
      </section>

      {isScanRunning &&
        activeScanId && (
          <ScanProgressModal
            scanId={
              activeScanId
            }
            targetUrl={
              activeTargetUrl
            }
            onCancel={
              handleCloseProgress
            }
            onComplete={
              handleScanComplete
            }
          />
        )}
    </DashboardLayout>
  );
}

export default NewScanPage;