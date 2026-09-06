const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const pdfRoutes = require("./routes/pdfRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    exposedHeaders: ["X-PDF-Queue-Active", "X-PDF-Queue-Position"],
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed"));
    },
  })
);

app.use(express.json());

// =========================
// TEMP FOLDER
// =========================

const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, {
    recursive: true,
  });
}

// =========================
// ROUTES
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WebTool API is running",
  });
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WebTool Backend is running",
  });
});

app.use("/api/pdf", pdfRoutes);

// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "PDF vượt quá giới hạn 50 MB.",
    });
  }

  if (err.message === "Only PDF files are allowed") {
    return res.status(415).json({
      success: false,
      message: "Chỉ chấp nhận file PDF.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Server error",
  });
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `Backend running at http://localhost:${PORT}`
  );
});