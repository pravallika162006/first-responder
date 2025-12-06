// server.js

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const alertRoutes = require("./routes/alert");


const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/firstresponder")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/alert", alertRoutes);

app.get("/", (req, res) => {
  res.send("First Responder API Running");
});

app.listen(5000, () => console.log("Server running on port 5000"));
