import { useNavigate } from "react-router-dom";
import "./PublicNavbar.css";

function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <header className="public-header">
      <button
        className="brand-button"
        type="button"
        onClick={() => navigate("/")}
      >
        CookieSolve
      </button>

      <nav className="public-navigation" aria-label="Main navigation">
        <button className="navigation-link" type="button"
          onClick={() => navigate("/about")}
        >
          About us
        </button>

        <button
          className="navigation-link"
          type="button"
          onClick={() => navigate("/sign-in")}
        >
          Sign In
        </button>

        <button
          className="outline-button signup-button"
          type="button"
          onClick={() => navigate("/sign-up")}
        >
          Sign Up
        </button>
      </nav>
    </header>
  );
}

export default PublicNavbar;