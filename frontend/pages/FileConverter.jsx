import { useRef, useState } from "react";
import { jsPDF } from "jspdf";

const CONVERTERS = [
  {
    id: "jpg-png",
    title: "JPG → PNG",
    description: "Chuyển ảnh JPG sang PNG",
    accept: "image/jpeg",
    output: "PNG",
  },
  {
    id: "png-jpg",
    title: "PNG → JPG",
    description: "Chuyển ảnh PNG sang JPG",
    accept: "image/png",
    output: "JPG",
  },
  {
    id: "webp-jpg",
    title: "WEBP → JPG",
    description: "Chuyển ảnh WEBP sang JPG",
    accept: "image/webp",
    output: "JPG",
  },
  {
    id: "image-pdf",
    title: "Ảnh → PDF",
    description: "Chuyển JPG, PNG, WEBP thành PDF",
    accept: "image/*",
    output: "PDF",
  },
];

function FileConverter() {
  const inputRef = useRef(null);

  const [converter, setConverter] = useState(null);
  const [file, setFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const [resultName, setResultName] = useState("");
  const [converting, setConverting] = useState(false);

  // =========================
  // CHỌN LOẠI CONVERT
  // =========================

  const selectConverter = (item) => {
    setConverter(item);
    setFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setPreviewUrl("");
    setResultUrl("");
    setResultName("");
  };

  // =========================
  // CHỌN FILE
  // =========================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(selectedFile);

    setPreviewUrl(url);

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }

    setResultName("");

    e.target.value = "";
  };

  // =========================
  // FORMAT FILE SIZE
  // =========================

  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // =========================
  // IMAGE → IMAGE
  // =========================

  const convertImage = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas không được hỗ trợ."));
          return;
        }

        // JPG không hỗ trợ nền trong suốt
        if (
          converter.id === "png-jpg" ||
          converter.id === "webp-jpg"
        ) {
          ctx.fillStyle = "#ffffff";

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        let mimeType = "image/png";
        let extension = "png";

        if (
          converter.id === "png-jpg" ||
          converter.id === "webp-jpg"
        ) {
          mimeType = "image/jpeg";
          extension = "jpg";
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error("Không thể tạo file.")
              );
              return;
            }

            resolve({
              blob,
              extension,
            });
          },
          mimeType,
          0.92
        );
      };

      img.onerror = () => {
        reject(
          new Error("Không thể đọc hình ảnh.")
        );
      };

      img.src = previewUrl;
    });
  };

  // =========================
  // IMAGE → PDF
  // =========================

  const convertToPDF = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const orientation =
          img.naturalWidth >= img.naturalHeight
            ? "landscape"
            : "portrait";

        const pdf = new jsPDF({
          orientation,
          unit: "px",
          format: [
            img.naturalWidth,
            img.naturalHeight,
          ],
        });

        pdf.addImage(
          img,
          "JPEG",
          0,
          0,
          img.naturalWidth,
          img.naturalHeight
        );

        const pdfBlob = pdf.output("blob");

        resolve({
          blob: pdfBlob,
          extension: "pdf",
        });
      };

      img.onerror = () => {
        reject(
          new Error("Không thể đọc hình ảnh.")
        );
      };

      img.src = previewUrl;
    });
  };

  // =========================
  // CONVERT
  // =========================

  const handleConvert = async () => {
    if (!file || !converter) {
      alert("Vui lòng chọn file trước.");
      return;
    }

    try {
      setConverting(true);

      let result;

      if (converter.id === "image-pdf") {
        result = await convertToPDF();
      } else {
        result = await convertImage();
      }

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }

      const url = URL.createObjectURL(
        result.blob
      );

      setResultUrl(url);

      const originalName =
        file.name
          .split(".")
          .slice(0, -1)
          .join(".") || "converted-file";

      setResultName(
        `${originalName}.${result.extension}`
      );
    } catch (error) {
      console.error(error);

      alert(
        "Không thể chuyển đổi file."
      );
    } finally {
      setConverting(false);
    }
  };

  // =========================
  // DOWNLOAD
  // =========================

  const handleDownload = () => {
    if (!resultUrl) return;

    const link = document.createElement("a");

    link.href = resultUrl;
    link.download = resultName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // =========================
  // RESET
  // =========================

  const resetConverter = () => {
    setConverter(null);
    setFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setPreviewUrl("");
    setResultUrl("");
    setResultName("");
  };

  return (
    <div className="tool-page">

      {/* HEADER */}

      <div className="tool-header">
        <div>
          <h1>File Converter</h1>

          <p>
            Chuyển đổi file nhanh chóng,
            miễn phí và riêng tư.
          </p>
        </div>
      </div>

      {/* =========================
          CHỌN CONVERTER
      ========================= */}

      {!converter && (
        <div className="converter-card">

          <h2>
            Bạn muốn chuyển đổi gì?
          </h2>

          <div className="converter-grid">

            {CONVERTERS.map((item) => (
              <button
                key={item.id}
                className="converter-option"
                onClick={() =>
                  selectConverter(item)
                }
              >
                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>
              </button>
            ))}

          </div>

        </div>
      )}

      {/* =========================
          WORKSPACE
      ========================= */}

      {converter && (
        <div className="converter-workspace">

          <div className="tool-card">

            <div className="converter-title">

              <div>
                <h2>
                  {converter.title}
                </h2>

                <p>
                  {converter.description}
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={resetConverter}
              >
                ← Chọn loại khác
              </button>

            </div>

            <div className="divider"></div>

            {/* FILE INPUT */}

            {!file && (
              <div
                className="upload-box"
                onClick={() =>
                  inputRef.current?.click()
                }
              >
                <div className="upload-icon">
                  📁
                </div>

                <h3>
                  Chọn file
                </h3>

                <p>
                  File sẽ được xử lý trực tiếp
                  trên trình duyệt.
                </p>

                <button className="primary-button">
                  Chọn file
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  accept={converter.accept}
                  onChange={handleFileChange}
                  hidden
                />
              </div>
            )}

            {/* FILE INFO */}

            {file && (
              <>

                <div className="file-info">

                  <div>
                    <span>
                      File
                    </span>

                    <strong>
                      {file.name}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Dung lượng
                    </span>

                    <strong>
                      {formatSize(file.size)}
                    </strong>
                  </div>

                </div>

                <button
                  className="primary-button full-width"
                  onClick={handleConvert}
                  disabled={converting}
                >
                  {converting
                    ? "Đang chuyển đổi..."
                    : `Chuyển đổi sang ${converter.output}`}
                </button>

              </>
            )}

          </div>

          {/* PREVIEW */}

          <div className="tool-card preview-card">

            <div className="preview-header">

              <h2>
                Preview
              </h2>

              {resultUrl && (
                <span className="success-badge">
                  ✓ Hoàn tất
                </span>
              )}

            </div>

            <div className="divider"></div>

            <div className="preview-container">

              {!file && (
                <div className="empty-preview">
                  <div>🔄</div>

                  <p>
                    Kết quả sẽ hiển thị ở đây
                  </p>
                </div>
              )}

              {file && !resultUrl && (
                <div className="image-preview">

                  {file.type.startsWith(
                    "image/"
                  ) ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                    />
                  ) : (
                    <div className="file-preview-icon">
                      📄
                    </div>
                  )}

                  <span>
                    File gốc
                  </span>

                </div>
              )}

              {resultUrl && (
                <div className="image-preview">

                  {converter.output !==
                    "PDF" ? (
                    <img
                      src={resultUrl}
                      alt="Converted"
                    />
                  ) : (
                    <div className="file-preview-icon">
                      📄
                    </div>
                  )}

                  <span>
                    {resultName}
                  </span>

                </div>
              )}

            </div>

            {resultUrl && (
              <button
                className="download-button"
                onClick={handleDownload}
              >
                ↓ Tải file xuống
              </button>
            )}

          </div>

        </div>
      )}

      {/* PRIVACY */}

      <div className="privacy-box">

        🔒 <strong>
          Private by design
        </strong>

        <span>
          File được xử lý trực tiếp trên
          trình duyệt. Không upload và
          không lưu dữ liệu.
        </span>

      </div>

    </div>
  );
}

export default FileConverter;