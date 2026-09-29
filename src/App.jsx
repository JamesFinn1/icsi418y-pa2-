import { useState } from "react";

// Empty object of our fields
const emptySignup = {
  firstName: "",
  lastName: "",
  username: "",
  password: ""
};

export default function App() {

  // Array deconstruction with imported function useState
  // Updates Ui elements 
  const [page, setPage] = useState("signup");
  const [signup, setSignup] = useState(emptySignup);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  function changePage(nextPage) {
    setPage(nextPage);
    setNotice(null);
  }

  function updateSignup(event) {
    const { name, value } = event.target;
    setSignup(current => ({ ...current, [name]: value }));
  }

  function updateLogin(event) {
    const { name, value } = event.target;
    setLogin(current => ({ ...current, [name]: value }));
  }

  // Submit button
  async function submitSignup(event) {
    event.preventDefault();
    setNotice(null);

    if (Object.values(signup).some(value => !value.trim())) {
      setNotice({ type: "error", text: "Please fill in every field." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup)
      });
      const data = await response.json();
      setNotice({
        type: response.ok ? "success" : "error",
        text: data.message || "Signup request finished."
      });

      if (response.ok) {
        setSignup(emptySignup);
        setLogin(current => ({ ...current, username: signup.username, password: "" }));
      }
    } catch {
      setNotice({
        type: "error",
        text: "Could not contact the server. Make sure the backend is running."
      });
    } finally {
      setBusy(false);
    }
  }

  // Login button
  async function submitLogin(event) {
    event.preventDefault();
    setNotice(null);

    if (!login.username.trim() || !login.password.trim()) {
      setNotice({ type: "error", text: "Please enter both username and password." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });
      const data = await response.json();
      setNotice({
        type: response.ok ? "success" : "error",
        text: data.message || "Login request finished."
      });
      if (response.ok) setLogin(current => ({ ...current, password: "" }));
    } catch {
      setNotice({
        type: "error",
        text: "Could not contact the server. Make sure the backend is running."
      });
    } finally {
      setBusy(false);
    }
  }

  // react/html formating code to be returned for the webpage being used/called in main.jsx
  return (
    <main className="page">
      <section className="auth-card">
        <div className="brand-mark" aria-hidden="true">ICSI</div>
        <h1>Welcome</h1>
        <p className="subtitle">Sign up or log in to continue.</p>

        <div className="tabs" role="tablist" aria-label="Authentication">
          <button
            className={page === "signup" ? "tab active" : "tab"}
            onClick={() => changePage("signup")}
            role="tab"
            aria-selected={page === "signup"}
            type="button"
          >
            Sign up
          </button>
          <button
            className={page === "login" ? "tab active" : "tab"}
            onClick={() => changePage("login")}
            role="tab"
            aria-selected={page === "login"}
            type="button"
          >
            Log in
          </button>
        </div>

        {notice && (
          <div className={`notice ${notice.type}`} role="status">
            {notice.text}
          </div>
        )}

        {page === "signup" ? (
          <form onSubmit={submitSignup}>
            <div className="name-row">
              <label>
                First name
                <input name="firstName" value={signup.firstName}
                  onChange={updateSignup} 
                  placeholder="First Name"/>
              </label>
              <label>
                Last name
                <input name="lastName" value={signup.lastName}
                  onChange={updateSignup} 
                  placeholder="Last Name"/>
              </label>
            </div>
            <label>
              Username
              <input name="username" value={signup.username}
                onChange={updateSignup} placeholder="Choose a username"
                autoComplete="username" maxLength="50" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={signup.password}
                onChange={updateSignup} placeholder="At least 8 characters"
                autoComplete="new-password" />
            </label>
            <button className="submit" type="submit" disabled={busy}>
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitLogin}>
            <label>
              Username
              <input name="username" value={login.username}
                onChange={updateLogin} placeholder="Your username"
                autoComplete="username" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={login.password}
                onChange={updateLogin} placeholder="Your password"
                autoComplete="current-password" />
            </label>
            <button className="submit" type="submit" disabled={busy}>
              {busy ? "Logging in..." : "Log in"}
            </button>
          </form>
        )}

        <p className="footnote">
          {page === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button className="text-button" type="button"
            onClick={() => changePage(page === "signup" ? "login" : "signup")}>
            {page === "signup" ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
      <p className="page-footer">ICSI 418Y· Assignment 2</p>
    </main>
  );
}