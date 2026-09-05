import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

function PdfMerger() {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");

  const addFiles = (selectedFiles) => {
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length !== selectedFiles.length) setError("Một số file không phải PDF và đã được bỏ qua.");
    else setError("");

    setFiles((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      return [...prev, ...pdfFiles.filter((file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`))];
    });
  };

  const handleFiles = (event) => {
    addFiles(Array.from(event.target.files || []));

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (index) => {
    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const moveUp = (index) => {
    if (index === 0) return;

    setFiles((prev) => {
      const newFiles = [...prev];

      [newFiles[index - 1], newFiles[index]] =
        [newFiles[index], newFiles[index - 1]];

      return newFiles;
    });
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;

    setFiles((prev) => {
      const newFiles = [...prev];

      [newFiles[index], newFiles[index + 1]] =
        [newFiles[index + 1], newFiles[index]];

      return newFiles;
    });
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      alert("Vui lòng chọn ít nhất 2 file PDF.");
      return;
    }

    try {
      setMerging(true);

      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();

        const pdf = await PDFDocument.load(arrayBuffer);

        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );

        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();

      const blob = new Blob(
        [pdfBytes],
        { type: "application/pdf" }
      );

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }

      const url = URL.createObjectURL(blob);

      setResultUrl(url);
    } catch (mergeError) {
      console.error(mergeError);
      setError("Không thể ghép PDF. Một file có thể bị lỗi hoặc được mã hóa.");
    } finally {
      setMerging(false);
    }
  };

  const downloadPDF = () => {
    if (!resultUrl) return;

    const link = document.createElement("a");

    link.href = resultUrl;
    link.download = "merged-document.pdf";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setFiles([]);

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
  };

  return (
    <div className="tool-page">

      {/* HEADER */}
      <div className="tool-header">
        <div>
          <h1>PDF Merger</h1>

          <p>
            Ghép nhiều file PDF thành một file duy nhất.
          </p>
        </div>

        <button
          className="choose-button"
          onClick={() => inputRef.current?.click()}
        >
          + Thêm PDF
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      <div className="tool-card">

        {/* EMPTY */}
        {files.length === 0 && (
          <div className="upload-box" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()}>
            <div className="upload-icon">
              📄
            </div>

            <h3>
              Chọn các file PDF
            </h3>

            <p>
              Chọn nhiều file hoặc kéo thả trực tiếp vào vùng này.
            </p>

            <button className="primary-button">
              Chọn PDF
            </button>
          </div>
        )}

        {/* FILE LIST */}
        {error && <p className="error-message">{error}</p>}

        {files.length > 0 && (
          <>
            <div className="pdf-list-header">
              <div>
                <h2>
                  Danh sách PDF
                </h2>

                <span>
                  {files.length} file
                </span>
              </div>

              <button
                className="secondary-button"
                onClick={clearAll}
              >
                Xóa tất cả
              </button>
            </div>

            <div className="pdf-list">

              {files.map((file, index) => (
                  <div
                    className="pdf-item"
                  key={`${file.name}-${index}`}
                >

                  <div className="pdf-icon">
                    PDF
                  </div>

                  <div className="pdf-info">

                    <strong>
                      {file.name}
                    </strong>

                    <span>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>

                  </div>

                  <div className="pdf-controls">

                    <button
                      onClick={() =>
                        moveUp(index)
                      }
                      disabled={index === 0}
                      title="Di chuyển lên"
                    >
                      ↑
                    </button>

                    <button
                      onClick={() =>
                        moveDown(index)
                      }
                      disabled={
                        index === files.length - 1
                      }
                      title="Di chuyển xuống"
                    >
                      ↓
                    </button>

                    <button
                      onClick={() =>
                        removeFile(index)
                      }
                      title="Xóa"
                    >
                      ×
                    </button>

                  </div>

                </div>
              ))}

            </div>

            <button
              className="primary-button full-width"
              onClick={mergePDFs}
              disabled={merging || files.length < 2}
            >
              {merging
                ? "Đang ghép PDF..."
                : "Ghép PDF"}
            </button>

            {resultUrl && (
              <button
                className="download-button"
                onClick={downloadPDF}
              >
                ↓ Tải PDF đã ghép
              </button>
            )}
          </>
        )}

      </div>

      {/* PRIVACY */}
      <div className="privacy-box">
        🔒 <strong>Private by design</strong>

        <span>
          PDF được xử lý trực tiếp trên trình duyệt.
          Không upload và không lưu dữ liệu trên server.
        </span>
      </div>

    </div>
  );
}

export default PdfMerger;