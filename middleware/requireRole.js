// middleware/requireRole.js
// Usage: requireRole("responder")
module.exports = function requireRole(role) {
  return (req, res, next) => {
    try {
      // Expect the requester to include their userId (or full user) in request body or headers.
      // For now, we read userId from req.body.responderId or req.body.userId or req.headers["x-user-id"]
      const userId = (req.body && (req.body.userId || req.body.responderId)) || req.headers["x-user-id"];
      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID required for role check" });
      }

      const User = require("../models/User");
      User.findById(userId).then(user => {
        if (!user) return res.status(401).json({ success: false, message: "User not found" });
        const roles = Array.isArray(user.roles) ? user.roles : [];
        if (!roles.includes(role)) {
          return res.status(403).json({ success: false, message: `Requires role: ${role}` });
        }
        // attach user to request for downstream handlers
        req.user = user;
        next();
      }).catch(err => {
        console.error("requireRole error", err);
        res.status(500).json({ success: false, message: "Server error" });
      });
    } catch (err) {
      console.error("requireRole catch", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};
