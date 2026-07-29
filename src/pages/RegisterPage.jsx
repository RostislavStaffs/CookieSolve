import "./RegisterPage.css";

function RegisterPage() {
  return (
    <form className="register-form">
      <div className="name-fields">
        <label className="visually-hidden" htmlFor="first-name">
          First name
        </label>

        <input
          id="first-name"
          name="firstName"
          type="text"
          placeholder="First name"
          autoComplete="given-name"
        />

        <label className="visually-hidden" htmlFor="last-name">
          Last name
        </label>

        <input
          id="last-name"
          name="lastName"
          type="text"
          placeholder="Last name"
          autoComplete="family-name"
        />
      </div>

      <label className="visually-hidden" htmlFor="register-email">
        Email address
      </label>

      <input
        id="register-email"
        name="email"
        type="email"
        placeholder="Email address"
        autoComplete="email"
      />

      <label className="visually-hidden" htmlFor="register-password">
        Password
      </label>

      <input
        id="register-password"
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
      />

      <label
        className="visually-hidden"
        htmlFor="register-confirm-password"
      >
        Confirm password
      </label>

      <input
        id="register-confirm-password"
        name="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        autoComplete="new-password"
      />

      <button className="create-account-button" type="button">
        Create account
      </button>
    </form>
  );
}

export default RegisterPage;