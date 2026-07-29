import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthSwitch.css";

function AuthSwitch({ activePage }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [selectedPage, setSelectedPage] = useState(activePage);

  useEffect(() => {
    setSelectedPage(activePage);

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [activePage]);

  const changePage = (page) => {
    if (page === selectedPage) {
      return;
    }

    window.clearTimeout(timerRef.current);
    setSelectedPage(page);

    timerRef.current = window.setTimeout(() => {
      navigate(page === "signup" ? "/sign-up" : "/sign-in");
    }, 280);
  };

  return (
    <div
      className={`auth-switch ${
        selectedPage === "signin" ? "show-signin" : "show-signup"
      }`}
      aria-label="Authentication pages"
    >
      <span className="auth-switch-slider" aria-hidden="true" />

      <button
        className={`auth-switch-button ${
          selectedPage === "signup" ? "active" : ""
        }`}
        type="button"
        aria-pressed={selectedPage === "signup"}
        onClick={() => changePage("signup")}
      >
        Sign up
      </button>

      <button
        className={`auth-switch-button ${
          selectedPage === "signin" ? "active" : ""
        }`}
        type="button"
        aria-pressed={selectedPage === "signin"}
        onClick={() => changePage("signin")}
      >
        Sign in
      </button>
    </div>
  );
}

export default AuthSwitch;