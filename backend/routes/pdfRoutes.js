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

const configuredConcurrency = Number.parseInt(process.env.PDF_CONCURRENCY, 10);
const maxConcurrentJobs = Number.isInteger(configuredConcurrency) && configuredConcurrency > 0
  ? configuredConcurrency
  : 2;
let activeJobs = 0;
const waitingJobs = [];

const startNextJob = () => {
  if (activeJobs >= maxConcurrentJobs || waitingJobs.length === 0) return;

  const startJob = waitingJobs.shift();
  startJob();
};

const limitPdfConcurrency = (req, res, next) => {
  const run = () => {
    activeJobs += 1;
    res.setHeader("X-PDF-Queue-Active", activeJobs);

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      activeJobs -= 1;
      startNextJob();
    };

    res.once("finish", release);
    res.once("close", release);
    next();
  };

  if (activeJobs < maxConcurrentJobs) {
    run();
    return;
  }

  waitingJobs.push(run);
  res.setHeader("X-PDF-Queue-Position", waitingJobs.length);
};

const getPdfQueueStatus = (req, res) => {
  res.json({
    success: true,
    active: activeJobs,
    waiting: waitingJobs.length,
    limit: maxConcurrentJobs,
  });
};

// =========================
// ROUTE
// =========================

router.get("/status", getPdfQueueStatus);

router.post("/compress", upload.single("pdf"), limitPdfConcurrency, compressPDF);

module.exports = router;