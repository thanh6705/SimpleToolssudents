const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  compressPDF,
} = require("../controllers/pdfController");

const router = express.Router();

// =========================
// MULTER
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../temp"));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.pdf`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed")
      );
    }

    cb(null, true);
  },
});

// =========================
// ROUTE
// =========================

router.post(
  "/compress",
  upload.single("pdf"),
  compressPDF
);

module.exports = router;