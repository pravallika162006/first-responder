// signup.js (single-step then role selection)
const API_BASE = "http://localhost:5000";
const errorBox = document.getElementById("signup-error");

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";
  errorBox.style.color = "red";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();

  // Validation
  if (!name || !email || !password || !phone) {
    errorBox.textContent = "All fields are required.";
    return;
  }
  if (password.length < 4) {
    errorBox.textContent = "Password must be at least 4 characters.";
    return;
  }
  if (!/^\d{7,15}$/.test(phone)) {
    errorBox.textContent = "Phone must be digits (7-15 characters).";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorBox.textContent = "Please enter a valid email address.";
    return;
  }

  try {
    // We do NOT send role here. Backend will default role to "reporter".
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone })
    });

    const data = await res.json();
    if (!data.success) {
      errorBox.textContent = data.message || "Signup failed";
      return;
    }

    // Save user and go to role selection page
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "role-select.html";

  } catch (err) {
    console.error("Signup error:", err);
    errorBox.textContent = "Server error. Try again.";
  }
});
