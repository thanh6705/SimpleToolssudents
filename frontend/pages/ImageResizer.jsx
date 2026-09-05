import { useEffect, useRef, useState } from "react";

function ImageResizer() {
  const [file, setFile] = useState(null);

  const [originalUrl, setOriginalUrl] = useState("");
  const [resizedUrl, setResizedUrl] = useState("");

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [keepRatio, setKeepRatio] = useState(true);
  const [resized, setResized] = useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const originalUrlRef = useRef("");
  const resizedUrlRef = useRef("");

  useEffect(() => {
    originalUrlRef.current = originalUrl;
    resizedUrlRef.current = resizedUrl;
  }, [originalUrl, resizedUrl]);

  // =========================
  // CHỌN ẢNH
  // =========================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.");
      return;
    }

    setError("");
    setFile(selectedFile);

    // Xóa kết quả resize cũ
    setResizedUrl("");
    setResized(false);

    // Tạo URL mới cho ảnh gốc
    const url = URL.createObjectURL(selectedFile);

    setOriginalUrl(url);

    // Đọc kích thước thật của ảnh
    const img = new Image();

    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);

      // Mặc định kích thước resize = kích thước ảnh gốc
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };

    img.onerror = () => {
      setError("Không thể đọc ảnh.");
    };

    img.src = url;

    // Cho phép chọn lại đúng file cũ
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================
  // GIỮ TỶ LỆ
  // =========================
  const handleWidthChange = (value) => {
    setWidth(value);

    if (
      keepRatio &&
      originalWidth > 0 &&
      originalHeight > 0 &&
      value
    ) {
      const newHeight = Math.round(
        (Number(value) * originalHeight) / originalWidth
      );

      setHeight(newHeight);
    }
  };

  const handleHeightChange = (value) => {
    setHeight(value);

    if (
      keepRatio &&
      originalWidth > 0 &&
      originalHeight > 0 &&
      value
    ) {
      const newWidth = Math.round(
        (Number(value) * originalWidth) / originalHeight
      );

      setWidth(newWidth);
    }
  };

  // =========================
  // RESIZE
  // =========================
  const handleResize = () => {
    setError("");

    if (!file || !originalUrl) {
      setError("Vui lòng chọn ảnh trước.");
      return;
    }

    const targetWidth = Number(width);
    const targetHeight = Number(height);

    if (
      !Number.isFinite(targetWidth) ||
      !Number.isFinite(targetHeight) ||
      targetWidth <= 0 ||
      targetHeight <= 0
    ) {
      setError("Kích thước ảnh không hợp lệ.");
      return;
    }

    if (targetWidth > 10000 || targetHeight > 10000) {
      setError("Kích thước tối đa là 10000 × 10000 px.");
      return;
    }

    const img = new Image();

    img.onload = () => {
      // =========================
      // CANVAS CÓ PIXEL THẬT
      // =========================

      const canvas = document.createElement("canvas");

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Trình duyệt không hỗ trợ Canvas.");
        return;
      }

      // Chất lượng resize
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Vẽ ảnh đúng kích thước canvas
      ctx.drawImage(
        img,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // =========================
      // TẠO FILE ẢNH MỚI
      // =========================

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Không thể tạo ảnh sau khi resize.");
            return;
          }

          // Xóa URL resize cũ
          if (resizedUrl) {
            URL.revokeObjectURL(resizedUrl);
          }

          const newUrl = URL.createObjectURL(blob);

          setResizedUrl(newUrl);
          setResized(true);
        },
        "image/png",
        1
      );
    };

    img.onerror = () => {
      setError("Không thể đọc ảnh để resize.");
    };

    img.src = originalUrl;
  };

  // =========================
  // DOWNLOAD
  // =========================
  const handleDownload = async () => {
    if (!resizedUrl) return;

    const response = await fetch(resizedUrl);
    const blob = await response.blob();

    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;

    link.download = `resized-${width}x${height}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);
  };

  // =========================
  // PRESET
  // =========================
  const handlePreset = (presetWidth, presetHeight) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
  };

  // =========================
  // CLEANUP URL
  // =========================
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) {
        URL.revokeObjectURL(originalUrlRef.current);
      }

      if (resizedUrlRef.current) {
        URL.revokeObjectURL(resizedUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="tool-page">

      {/* HEADER */}
      <div className="tool-header">
        <div>
          <h1>Image Resizer</h1>
          <p>
            Thay đổi kích thước hình ảnh nhanh chóng,
            miễn phí và riêng tư.
          </p>
        </div>
      </div>

      <div className="resizer-grid">

        {/* =========================
            LEFT
        ========================= */}
        <div className="tool-card">

          <div className="card-header">
            <h2>Kích thước ảnh</h2>

            <button
              className="choose-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Chọn ảnh khác
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </div>

          {/* ẢNH GỐC */}
          {file && (
            <div className="file-info">

              <div>
                <span>Ảnh gốc</span>

                <strong>
                  {originalWidth} × {originalHeight} px
                </strong>
              </div>

              <div>
                <span>File</span>

                <strong title={file.name}>
                  {file.name}
                </strong>
              </div>

            </div>
          )}

          {/* INPUT */}
          <div className="dimension-row">

            <div className="dimension-input">
              <label>Width</label>

              <div className="input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={width}
                  onChange={(e) =>
                    handleWidthChange(e.target.value)
                  }
                />

                <span>px</span>
              </div>
            </div>

            <div className="multiply">×</div>

            <div className="dimension-input">
              <label>Height</label>

              <div className="input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={height}
                  onChange={(e) =>
                    handleHeightChange(e.target.value)
                  }
                />

                <span>px</span>
              </div>
            </div>

          </div>

          {/* KEEP RATIO */}
          <label className="ratio-checkbox">
            <input
              type="checkbox"
              checked={keepRatio}
              onChange={(e) =>
                setKeepRatio(e.target.checked)
              }
            />

            <span>Giữ tỷ lệ ảnh</span>
          </label>

          {/* PRESETS */}
          <div className="preset-section">

            <h3>Kích thước phổ biến</h3>

            <div className="preset-grid">

              <button
                onClick={() =>
                  handlePreset(1920, 1080)
                }
              >
                1920 × 1080
              </button>

              <button
                onClick={() =>
                  handlePreset(1280, 720)
                }
              >
                1280 × 720
              </button>

              <button
                onClick={() =>
                  handlePreset(1080, 1080)
                }
              >
                1080 × 1080
              </button>

              <button
                onClick={() =>
                  handlePreset(800, 600)
                }
              >
                800 × 600
              </button>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* RESIZE BUTTON */}
          <button
            className="resize-button"
            onClick={handleResize}
          >
            Resize ảnh
          </button>

        </div>

        {/* =========================
            RIGHT - PREVIEW
        ========================= */}
        <div className="tool-card preview-card">

          <div className="card-header">
            <h2>Preview</h2>

            {resized && (
              <span className="resize-status">
                ✓ Đã resize
              </span>
            )}
          </div>

          <div className="preview-container">

            {!file && (
              <div className="empty-preview">
                Chưa có ảnh
              </div>
            )}

            {/* SAU KHI RESIZE -> HIỂN THỊ ẢNH MỚI */}
            {file && resizedUrl && (
              <>
                <img
                  src={resizedUrl}
                  alt="Resized"
                  className="preview-image"
                />

                <div className="preview-size">
                  {width} × {height} px
                </div>
              </>
            )}

            {/* TRƯỚC KHI RESIZE -> HIỂN THỊ ẢNH GỐC */}
            {file && !resizedUrl && originalUrl && (
              <>
                <img
                  src={originalUrl}
                  alt="Original"
                  className="preview-image"
                />

                <div className="preview-size">
                  Ảnh gốc
                </div>
              </>
            )}

          </div>

          {/* DOWNLOAD */}
          {resizedUrl && (
            <button
              className="download-button"
              onClick={handleDownload}
            >
              ↓ Tải ảnh xuống
            </button>
          )}

        </div>

      </div>

      {/* PRIVACY */}
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

export default ImageResizer;