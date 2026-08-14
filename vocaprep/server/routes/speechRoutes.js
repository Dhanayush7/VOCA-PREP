// server/routes/speechRoutes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { speechToText } = require("../services/sarvamService");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB safety limit
});

// POST /api/speech-to-text
router.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      error: "No audio file was received. Please record an answer and try again.",
    });
  }

  try {
    if (file.size === 0) {
      throw Object.assign(new Error("The recording was empty."), {
        code: "EMPTY_RECORDING",
        status: 422,
      });
    }

    const transcript = await speechToText(file.path, file.originalname);
    return res.json({ transcript });
  } catch (err) {
    console.error("[speech-to-text] error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: friendlyMessage(err),
      code: err.code || "SPEECH_TO_TEXT_FAILED",
    });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

function friendlyMessage(err) {
  if (err.code === "MISSING_API_KEY") {
    return "Speech-to-text is not configured on the server yet. Add a SARVAM_API_KEY in server/.env.";
  }
  if (err.code === "EMPTY_TRANSCRIPT" || err.code === "EMPTY_RECORDING") {
    return "We couldn't detect any speech in that recording. Please try again and speak clearly.";
  }
  if (err.code === "SARVAM_NETWORK_ERROR") {
    return "Couldn't reach the speech recognition service. Check your internet connection and try again.";
  }
  return "Something went wrong converting your speech to text. Please try again.";
}

module.exports = router;