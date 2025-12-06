// scripts/migrate-roles.js
const mongoose = require("mongoose");
const User = require("../models/User"); // adjust path if needed

// Put your local Mongo URI here if you don't use an env var.
// Example local default: "mongodb://127.0.0.1:27017/first-responders"
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/first-responders";

async function migrate() {
  await mongoose.connect(MONGO); // no extra options
  console.log("Connected to Mongo");

  // Find documents that still have legacy 'role' field
  const raw = await User.collection.find({ role: { $exists: true } }).toArray();

  for (const doc of raw) {
    const id = doc._id;
    const legacyRole = doc.role || "reporter";
    // if roles already exists and is non-empty, keep it; otherwise set from legacy role
    const newRoles = Array.isArray(doc.roles) && doc.roles.length ? doc.roles : [legacyRole];
    await User.updateOne(
      { _id: id },
      { $set: { roles: newRoles }, $unset: { role: "" } }
    );
    console.log(`Migrated user ${id} -> roles: [${newRoles.join(",")}]`);
  }

  console.log("Migration done.");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
