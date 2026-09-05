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