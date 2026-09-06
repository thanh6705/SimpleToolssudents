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
      "-dPDFSTOPONERROR",
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

    console.error("PDF compression failed:", {
      message: error.message,
      stderr: error.stderr,
      code: error.code,
      signal: error.signal,
    });

    deleteTempFile(inputPath);
    deleteTempFile(outputPath);

    const message = error.code === "ETIMEDOUT"
      ? "PDF xử lý quá lâu. File có thể quá phức tạp hoặc chứa hình ảnh nặng."
      : "Ghostscript không thể xử lý PDF này. File có thể bị lỗi hoặc dùng nội dung không tương thích.";

    res.status(error.code === "ETIMEDOUT" ? 504 : 422).json({
      success: false,
      message,
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