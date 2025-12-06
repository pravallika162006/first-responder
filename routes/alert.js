// alert.js (Routes + Controller)

const express = require("express");
const router = express.Router();
const Alert = require("../models/Alertmodel");
const User = require("../models/User");


// ------------------------------------------------------
// CREATE ALERT
// ------------------------------------------------------
router.post("/create", async (req, res) => {
  try {
    const { reporterId, description, location } = req.body;

    if (!reporterId || !description || !location) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const user = await User.findById(reporterId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const alert = await Alert.create({
      reporterId,
      reporterName: user.name,
      reporterPhone: user.phone,
      description,
      location,
      status: "NEW"
    });

    res.json({ success: true, alert });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------
// GET ALL ALERTS (NO POPULATE — since we use embedded info)
// ------------------------------------------------------
router.get("/all", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to fetch alerts" });
  }
});

// ------------------------------------------------------
// ACCEPT ALERT
// ------------------------------------------------------
router.post("/accept", async (req, res) => {
  try {
    const { alertId } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) return res.json({ success: false, message: "Alert not found" });

    alert.status = "ACCEPTED";
    await alert.save();

    res.json({ success: true, alert });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to accept alert" });
  }
});

// ------------------------------------------------------
// COMPLETE ALERT
// ------------------------------------------------------
router.post("/complete", async (req, res) => {
  try {
    const { alertId } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) return res.json({ success: false, message: "Alert not found" });

    alert.status = "COMPLETED";
    await alert.save();

    res.json({ success: true, alert });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to complete alert" });
  }
});

module.exports = router;
