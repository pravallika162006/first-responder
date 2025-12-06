// role-select.js

console.log("Role select page loaded.");

// Load user from localStorage
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  // User not logged in → redirect to login page
  window.location.href = "index.html";
}

// Button Elements
const reporterBtn = document.getElementById("reporterBtn");
const responderBtn = document.getElementById("responderBtn");
const skipBtn = document.getElementById("skipBtn");

// Click: Register as REPORTER
reporterBtn.addEventListener("click", () => {
  console.log("Reporter selected");

  // Add reporter role (if not present)
  fetch("http://localhost:5000/auth/add-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user._id, role: "reporter" }),
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "reporter.html";
    });
});

// Click: Register as RESPONDER
responderBtn.addEventListener("click", () => {
  console.log("Responder selected");

  fetch("http://localhost:5000/auth/add-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user._id, role: "responder" }),
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    });
});

// Skip → Go to dashboard
skipBtn.addEventListener("click", () => {
  console.log("Skipped role selection");
  window.location.href = "dashboard.html";
});
