// auth.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// ------------------------------------------------------
// SIGNUP
// ------------------------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      roles: ["reporter"]
    });

    res.json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Signup failed" });
  }
});

// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, message: "Invalid password" });

    res.json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Login failed" });
  }
});

// ------------------------------------------------------
// ADD ROLE (Reporter → Responder)
// ------------------------------------------------------
router.post("/add-role", async (req, res) => {
  try {
    const { userId, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (!user.roles.includes(role)) {
      user.roles.push(role);
      await user.save();
    }

    res.json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Could not add role" });
  }
});

module.exports = router;
