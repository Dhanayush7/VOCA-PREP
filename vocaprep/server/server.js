// server/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const speechRoutes = require("./routes/speechRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    sarvamConfigured: Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY.trim()),
  });
});

app.use("/api", speechRoutes);
app.use("/api", evaluationRoutes);
app.use("/api", interviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Central error handler - never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(err.status || 500).json({
    error: "Something went wrong on the server. Please try again.",
  });
});

app.listen(PORT, () => {
  console.log(`VocaPrep server running on http://localhost:${PORT}`);
  if (!process.env.SARVAM_API_KEY || !process.env.SARVAM_API_KEY.trim()) {
    console.warn(
      "WARNING: SARVAM_API_KEY is not set in server/.env - AI features will return a configuration error until it is added."
    );
  }
});