// ==========================
// LOGIN FUNCTIONALITY
// ==========================
const API_BASE = "http://localhost:5000";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // stop page reload
  loginError.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    loginError.textContent = "Please fill all fields";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      loginError.textContent = data.message || "Login failed";
      return;
    }

    // Save logged-in user
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirect based on role
    if (data.user.role === "reporter") {
      window.location.href = "reporter.html";
    } else if (data.user.role === "responder") {
      window.location.href = "dashboard.html";
    } else {
      // fallback
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    loginError.textContent = "Server error. Check backend.";
  }
});
