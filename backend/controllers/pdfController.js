const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const compressPDF = async (req, res) => {
  let inputPath = null;
  let outputPath = null;

  try {
    // =========================
    // CHECK FILE
    // =========================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    inputPath = req.file.path;

    const outputName =
      `compressed-${Date.now()}.pdf`;

    outputPath = path.join(
      path.dirname(inputPath),
      outputName
    );

    await execFileAsync("gs", [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dBATCH",
      "-dSAFER",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ], { timeout: 120000, maxBuffer: 1024 * 1024 });

    // =========================
    // SEND FILE
    // =========================

    res.download(outputPath, "compressed.pdf", (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to send compressed PDF" });
      }
      deleteTempFile(inputPath);
      deleteTempFile(outputPath);
    });

  } catch (error) {

    console.error("PDF compression failed:", error.message);

    deleteTempFile(inputPath);
    deleteTempFile(outputPath);

    res.status(500).json({
      success: false,
      message: "Failed to compress PDF",
    });
  }
};

// =========================
// DELETE TEMP FILE
// =========================

const deleteTempFile = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error(
        "Failed to delete:",
        filePath
      );
    }
  });
};

module.exports = {
  compressPDF,
};