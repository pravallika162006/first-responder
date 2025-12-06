// reporter.js - updated (Get location, preset coords, submit alert, become responder, logout)
const API_BASE = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  const createAlertForm = document.getElementById("create-alert-form");
  const locBtn = document.getElementById("loc-btn");
  const preset = document.getElementById("preset-coords");
  const logoutTop = document.getElementById("logout-btn");
  const becomeTop = document.getElementById("become-responder-btn-top");
  const latEl = document.getElementById("lat");
  const lngEl = document.getElementById("lng");

  // logout
  if (logoutTop) {
    logoutTop.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // become responder (top button)
  if (becomeTop) {
    becomeTop.addEventListener("click", async () => {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u || !u._id) {
        alert("Please login first.");
        return;
      }
      becomeTop.disabled = true;
      const prev = becomeTop.textContent;
      becomeTop.textContent = "Enabling...";
      try {
        const res = await fetch(`${API_BASE}/auth/add-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u._id, role: "responder" })
        });
        const data = await res.json().catch(()=>null);
        if (!data || !data.success) {
          alert((data && data.message) ? data.message : "Could not enable responder role.");
          becomeTop.disabled = false;
          becomeTop.textContent = prev;
          return;
        }
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "dashboard.html";
      } catch (err) {
        console.error(err);
        alert("Network error.");
        becomeTop.disabled = false;
        becomeTop.textContent = prev;
      }
    });
  }

  // preset coords selection
  if (preset) {
    preset.addEventListener("change", () => {
      const v = preset.value;
      if (!v) return;
      const parts = v.split(",").map(s => s.trim());
      if (parts.length === 2) {
        latEl.value = parts[0];
        lngEl.value = parts[1];
      }
    });
  }

  // get device location
  if (locBtn) {
    locBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser.");
        return;
      }
      locBtn.disabled = true;
      locBtn.textContent = "Locating...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          latEl.value = String(latitude);
          lngEl.value = String(longitude);
          locBtn.disabled = false;
          locBtn.textContent = "📍 Get My Location";
        },
        (err) => {
          console.error("Geo error:", err);
          alert("Unable to get location. Please allow location access or use preset.");
          locBtn.disabled = false;
          locBtn.textContent = "📍 Get My Location";
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // submit alert
  if (createAlertForm) {
    createAlertForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user || !user._id) {
        alert("Please login first.");
        return;
      }

      const description = (document.getElementById("desc") || {}).value || "";
      const lat = parseFloat((latEl || {}).value || "");
      const lng = parseFloat((lngEl || {}).value || "");

      if (!description.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
        alert("Description and valid coordinates are required (use Get My Location or presets).");
        return;
      }

      const submitBtn = document.getElementById("submit-btn");
      const prevText = submitBtn ? submitBtn.textContent : null;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting..."; }

      try {
        const res = await fetch(`${API_BASE}/alert/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reporterId: user._id,
            description: description.trim(),
            location: { lat, lng }
          })
        });
        const data = await res.json().catch(()=>null);
        if (data && data.success) {
          alert("Alert submitted!");
          createAlertForm.reset();
          // keep lat/lng if you want; here we clear them
          latEl.value = "";
          lngEl.value = "";
        } else {
          alert((data && data.message) ? data.message : "Failed to create alert.");
        }
      } catch (err) {
        console.error("submit error:", err);
        alert("Server error.");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = prevText || "Submit Alert"; }
      }
    });
  }
});
