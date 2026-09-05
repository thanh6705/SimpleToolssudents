import { useEffect, useRef, useState } from "react";

function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [compressedUrl, setCompressedUrl] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState("image/jpeg");
  const [isCompressing, setIsCompressing] = useState(false);

  const inputRef = useRef(null);

  // Dọn URL cũ để tránh memory leak
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  // Chọn ảnh
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Vui lòng chọn một file ảnh.");
      return;
    }

    // Xóa kết quả cũ
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
    }

    const url = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setOriginalUrl(url);
    setOriginalSize(selectedFile.size);

    setCompressedUrl("");
    setCompressedSize(0);
  };

  // Cho phép chọn lại đúng file cũ
  const handleChooseImage = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  // Format dung lượng
  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const createBlob = (img, mimeType, requestedQuality) =>
    new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (!ctx) {
        resolve(null);
        return;
      }

      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(resolve, mimeType, requestedQuality);
    });

  // Nén ảnh, thử giảm chất lượng dần để tránh tạo ra file lớn hơn bản gốc.
  const handleCompress = () => {
    if (!file) {
      alert("Vui lòng chọn ảnh trước.");
      return;
    }

    setIsCompressing(true);

    const img = new Image();

    img.onload = async () => {
      let outputFormat = format;
      let blob = await createBlob(img, outputFormat, quality);

      if (blob && blob.size >= originalSize) {
        outputFormat = "image/jpeg";
        for (const attemptQuality of [0.75, 0.6, 0.45]) {
          const candidate = await createBlob(img, outputFormat, attemptQuality);
          if (candidate && candidate.size < originalSize) {
            blob = candidate;
            break;
          }
          blob = candidate;
        }
      }

      if (!blob) {
        alert("Không thể nén ảnh.");
        setIsCompressing(false);
        return;
      }

      if (blob.size >= originalSize) {
        alert("Ảnh này đã được tối ưu hoặc quá nhỏ để giảm thêm dung lượng.");
        setCompressedUrl("");
        setCompressedSize(0);
        setIsCompressing(false);
        return;
      }

      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      setCompressedUrl(URL.createObjectURL(blob));
      setCompressedSize(blob.size);
      setFormat(outputFormat);
      setIsCompressing(false);
    };

    img.onerror = () => {
      alert("Không thể đọc ảnh.");
      setIsCompressing(false);
    };

    img.src = originalUrl;
  };

  // Tải ảnh
  const handleDownload = () => {
    if (!compressedUrl) return;

      const extension = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";

    const link = document.createElement("a");

    link.href = compressedUrl;
    link.download = `compressed-image.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressionPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.max(
          0,
          ((originalSize - compressedSize) / originalSize) * 100
        )
      : 0;

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div>
          <h1>Image Compressor</h1>

          <p>
            Giảm dung lượng hình ảnh nhanh chóng, miễn phí và riêng tư.
          </p>
        </div>

        <button
          className="choose-button"
          onClick={handleChooseImage}
        >
          Chọn ảnh
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className="compressor-grid">
        {/* LEFT */}
        <div className="tool-card">
          <h2>Nén hình ảnh</h2>

          <div className="divider"></div>

          {!file ? (
            <div
              className="upload-box"
              onClick={handleChooseImage}
            >
              <div className="upload-icon">🖼️</div>

              <h3>Chọn ảnh để nén</h3>

              <p>
                JPG, PNG, WebP và các định dạng ảnh phổ biến
              </p>

              <button className="primary-button">
                Chọn ảnh từ máy
              </button>
            </div>
          ) : (
            <>
              {/* Thông tin file */}
              <div className="file-info">
                <div>
                  <span>Ảnh gốc</span>
                  <strong>
                    {formatSize(originalSize)}
                  </strong>
                </div>

                <div>
                  <span>Tên file</span>
                  <strong className="file-name">
                    {file.name}
                  </strong>
                </div>
              </div>

              {/* Quality */}
              <div className="setting-group">
                <div className="setting-title">
                  <label>Chất lượng</label>

                  <strong>
                    {Math.round(quality * 100)}%
                  </strong>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) =>
                    setQuality(Number(e.target.value))
                  }
                />

                <div className="range-labels">
                  <span>Nhỏ hơn</span>
                  <span>Chất lượng cao</span>
                </div>
              </div>

              {/* Format */}
              <div className="setting-group">
                <label>Định dạng xuất</label>

                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value)
                  }
                >
                  <option value="image/jpeg">
                    JPG
                  </option>

                  <option value="image/png">
                    PNG
                  </option>

                  <option value="image/webp">
                    WebP
                  </option>
                </select>
              </div>

              {/* Button */}
              <button
                className="primary-button full-width"
                onClick={handleCompress}
                disabled={isCompressing}
              >
                {isCompressing
                  ? "Đang nén..."
                  : "Nén ảnh"}
              </button>

              {/* Result */}
              {compressedSize > 0 && (
                <div className="compression-result">
                  <div>
                    <span>Dung lượng sau nén</span>

                    <strong>
                      {formatSize(compressedSize)}
                    </strong>
                  </div>

                  <div>
                    <span>Đã giảm</span>

                    <strong>
                      {compressionPercent.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="tool-card preview-card">
          <div className="preview-header">
            <h2>Preview</h2>

            {compressedUrl && (
              <span className="success-badge">
                ✓ Đã nén
              </span>
            )}
          </div>

          <div className="divider"></div>

          <div className="preview-container">
            {!file && (
              <div className="empty-preview">
                <div>🖼️</div>

                <p>
                  Ảnh sau khi nén sẽ hiển thị ở đây
                </p>
              </div>
            )}

            {file && !compressedUrl && (
              <div className="image-preview">
                <img
                  src={originalUrl}
                  alt="Ảnh gốc"
                />

                <span>Ảnh gốc</span>
              </div>
            )}

            {compressedUrl && (
              <div className="image-preview">
                <img
                  src={compressedUrl}
                  alt="Ảnh sau khi nén"
                />

                <span>
                  Ảnh sau khi nén
                </span>
              </div>
            )}
          </div>

          {compressedUrl && (
            <button
              className="download-button"
              onClick={handleDownload}
            >
              ↓ Tải ảnh xuống
            </button>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="privacy-box">
        🔒 <strong>Private by design</strong>

        <span>
          Ảnh được xử lý trực tiếp trên trình duyệt.
          Không upload và không lưu ảnh trên server.
        </span>
      </div>
    </div>
  );
}

export default ImageCompressor;