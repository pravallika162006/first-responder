// Alert.js (Mongoose Model)

const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  reporterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // Embedded reporter details (Option A)
  reporterName: { type: String, required: true },
  reporterPhone: { type: String, required: true },

  description: { type: String, required: true },

  location: {
    lat: Number,
    lng: Number
  },

  status: {
    type: String,
    enum: ["NEW", "ACCEPTED", "IN_PROGRESS", "COMPLETED"],
    default: "NEW"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", alertSchema);
