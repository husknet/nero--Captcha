import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Path setup for serving built frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HCAPTCHA_SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY;
const SUCCESS_REDIRECT_URL = process.env.SUCCESS_REDIRECT_URL;

// API to expose redirect URL to frontend (safe, not a secret)
app.get("/api/env", (req, res) => {
  res.json({
    redirectUrl: SUCCESS_REDIRECT_URL
  });
});

// Verify hCaptcha
app.post("/api/verify-hcaptcha", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: "Missing token" });
  }

  try {
    const verifyRes = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({
        secret: HCAPTCHA_SECRET_KEY,
        response: token,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    if (verifyRes.data.success) {
      return res.json({ success: true });
    } else {
      return res.status(403).json({ success: false, error: "Captcha failed" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: "Verification error" });
  }
});

// Serve static frontend (production)
app.use(express.static(path.resolve(__dirname, "../dist")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const PORT = 5174;
app.listen(PORT, () => {
  console.log(`hCaptcha backend listening on port ${PORT}`);
});
