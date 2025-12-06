// dashboard.js (robust, small right-corner buttons, role-switch, accept/complete)
const API_BASE = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  // elements
  const roleSwitchBtn = document.getElementById("role-switch-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // get user from localStorage
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch(e){ console.error("local user parse err", e); }

  console.log("dashboard.js loaded — user:", user);

  if (!user) {
    // not logged in
    window.location.href = "index.html";
    return;
  }

  // Ensure responder role required
  const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  if (!roles.includes("responder")) {
    // If user is not responder, send to reporter page
    window.location.href = "reporter.html";
    return;
  }

  // wire logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // wire role-switch (switch to reporter)
  if (roleSwitchBtn) {
    roleSwitchBtn.addEventListener("click", async () => {
      roleSwitchBtn.disabled = true;
      roleSwitchBtn.textContent = "Switching...";
      try {
        // call backend to add role (optional; switching to reporter means frontend just redirects)
        const res = await fetch(`${API_BASE}/auth/add-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, role: "reporter" })
        });
        const data = await res.json().catch(()=>null);
        console.log("add-role (reporter) ->", res.status, data);

        if (data && data.success && data.user) {
          // update localStorage
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          // fallback: ensure roles array contains reporter
          const u = JSON.parse(localStorage.getItem("user") || "null") || {};
          u.roles = Array.isArray(u.roles) ? u.roles : [];
          if (!u.roles.includes("reporter")) u.roles.push("reporter");
          localStorage.setItem("user", JSON.stringify(u));
          console.warn("role-switch: used client-side fallback");
        }

        // redirect to reporter page
        window.location.href = "reporter.html";

      } catch (err) {
        console.error("role-switch error:", err);
        // fallback local redirect
        window.location.href = "reporter.html";
      }
    });
  }

  // --- Alerts logic (same behaviour as before, but spaced down) ---
  async function loadAlerts() {
    const container = document.getElementById("alerts-container");
    container.innerHTML = "<div class='card empty'>Loading alerts...</div>";

    try {
      const res = await fetch(`${API_BASE}/alert/all`);
      const data = await res.json().catch(()=>null);
      console.log("GET /alert/all ->", res.status, data);

      if (!data || !data.success) {
        container.innerHTML = `<div class="card empty">Error loading alerts: ${data && data.message ? data.message : "Server error"}</div>`;
        return;
      }

      const alerts = data.alerts || [];
      const visible = alerts.filter(a => {
        const s = a.status ? String(a.status).toUpperCase() : "NEW";
        return s !== "COMPLETED" && s !== "RESOLVED" && s !== "DONE";
      });

      if (visible.length === 0) {
        container.innerHTML = `<div class="card empty">No active alerts found</div>`;
        return;
      }

      container.innerHTML = "";
      visible.forEach(alert => {
        const card = document.createElement("div");
        card.className = "alert-card";

        // location safe extraction
        let lat = null, lng = null;
        if (alert.location) {
          if (typeof alert.location.lat === "number" && typeof alert.location.lng === "number") {
            lat = alert.location.lat; lng = alert.location.lng;
          } else if (typeof alert.location.latitude === "number" && typeof alert.location.longitude === "number") {
            lat = alert.location.latitude; lng = alert.location.longitude;
          } else if (typeof alert.location === "string") {
            const parts = alert.location.split(",").map(s => parseFloat(s.trim()));
            if (parts.length===2 && !isNaN(parts[0]) && !isNaN(parts[1])) { lat = parts[0]; lng = parts[1]; }
          } else if (alert.location.coordinates && Array.isArray(alert.location.coordinates)) {
            const c = alert.location.coordinates;
            if (c.length>=2) { lng = parseFloat(c[0]); lat = parseFloat(c[1]); }
          }
        }

        const locText = (lat!==null && lng!==null) ? `${lat}, ${lng}` : "Not available";
        const status = alert.status ? String(alert.status).toUpperCase() : "NEW";
        const isAccepted = status === "ACCEPTED" || status === "IN_PROGRESS";
        const isCompleted = status === "COMPLETED" || status === "RESOLVED";

        const reporterName = alert.reporterName || (alert.reporterId && alert.reporterId.name) || "Unknown";
        const reporterPhone = alert.reporterPhone || (alert.reporterId && alert.reporterId.phone) || "";

        card.innerHTML = `
          <h3>${escapeHtml(alert.type || "Emergency Alert")}</h3>
          <p><b>Description:</b> ${escapeHtml(alert.description || "-")}</p>
          <p><b>Location:</b> ${escapeHtml(locText)}</p>
          ${ lat!==null && lng!==null ? `<p><a href="https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}" target="_blank">🗺️ Open in Google Maps</a></p>` : "" }
          <p><b>Status:</b> ${escapeHtml(status)}</p>
          <p><b>Reporter:</b> ${escapeHtml(reporterName)}</p>
          <p><b>Contact:</b> ${escapeHtml(reporterPhone || "Not provided")} ${ reporterPhone ? ` &nbsp; <a href="tel:${reporterPhone}">📞 Call</a>` : "" }</p>
          <div class="alert-actions">
            ${!isAccepted && !isCompleted ? `<button class="accept-btn">Accept</button>` : ""}
            ${isAccepted && !isCompleted ? `<button class="complete-btn">Complete</button>` : ""}
          </div>
        `;

        container.appendChild(card);

        const acceptBtn = card.querySelector(".accept-btn");
        if (acceptBtn) {
          acceptBtn.addEventListener("click", async () => {
            acceptBtn.disabled = true;
            acceptBtn.textContent = "Accepting...";
            try {
              await acceptAlert(alert._id);
            } finally {
              acceptBtn.disabled = false;
              acceptBtn.textContent = "Accept";
            }
          });
        }

        const completeBtn = card.querySelector(".complete-btn");
        if (completeBtn) {
          completeBtn.addEventListener("click", async () => {
            completeBtn.disabled = true;
            completeBtn.textContent = "Completing...";
            try {
              await completeAlert(alert._id);
            } finally {
              completeBtn.disabled = false;
              completeBtn.textContent = "Complete";
            }
          });
        }
      });

    } catch (err) {
      console.error("loadAlerts error:", err);
      document.getElementById("alerts-container").innerHTML = `<div class="card empty">Server error: ${escapeHtml(err.message||String(err))}</div>`;
    }
  }

  async function acceptAlert(alertId) {
    try {
      const res = await fetch(`${API_BASE}/alert/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, responderId: user._id })
      });
      const data = await res.json().catch(()=>null);
      console.log("accept response:", res.status, data);
      if (!data || !data.success) {
        alert((data && data.message) || "Failed to accept alert");
        return;
      }
      await loadAlerts();
    } catch (err) {
      console.error("accept error:", err);
      alert("Server error while accepting alert");
    }
  }

  async function completeAlert(alertId) {
    try {
      const res = await fetch(`${API_BASE}/alert/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, responderId: user._id })
      });
      const data = await res.json().catch(()=>null);
      console.log("complete response:", res.status, data);
      if (!data || !data.success) {
        alert((data && data.message) || "Failed to complete alert");
        return;
      }
      await loadAlerts();
    } catch (err) {
      console.error("complete error:", err);
      alert("Server error while completing alert");
    }
  }

  // small helper
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  // initial load
  loadAlerts();
});
