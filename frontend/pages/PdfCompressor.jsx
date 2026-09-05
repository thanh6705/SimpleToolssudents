import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function PdfCompressor() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Vui lòng chọn đúng file PDF.");
      return;
    }

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(selectedFile);
    setResultUrl("");
    setResultSize(0);
    setError("");
  };

  const compressPdf = async () => {
    if (!file) {
      setError("Vui lòng chọn file PDF trước.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch(`${API_URL}/api/pdf/compress`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Backend không thể nén file PDF.";
        try {
          const payload = await response.json();
          message = payload.message || message;
        } catch {
          // Keep the generic message when the server returns no JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (compressionError) {
      console.error(compressionError);
      setError(compressionError.message || "Không thể nén file PDF.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `optimized-${file.name}`;
    link.click();
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div>
          <p className="eyebrow">PDF WORKSPACE</p>
          <h1>PDF Compressor</h1>
          <p>Re-save PDF ngay trên trình duyệt để giảm phần metadata và cấu trúc dư thừa.</p>
        </div>
        <button className="choose-button" onClick={() => inputRef.current?.click()}>Chọn PDF</button>
        <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />
      </div>

      <div className="tool-card compressor-single-card">
        {!file ? (
          <div className="upload-box" onClick={() => inputRef.current?.click()}>
            <div className="upload-icon">PDF</div>
            <h3>Thả file PDF vào đây</h3>
            <p>File được gửi tạm đến server để nén rồi xóa ngay sau khi trả kết quả.</p>
            <button className="primary-button">Chọn file PDF</button>
          </div>
        ) : (
          <div className="pdf-compressor-content">
            <div className="file-info">
              <div><span>File đã chọn</span><strong className="file-name">{file.name}</strong></div>
              <div><span>Dung lượng gốc</span><strong>{formatSize(file.size)}</strong></div>
            </div>
            {resultUrl && (
              <div className="compression-result">
                <div><span>Dung lượng sau xử lý</span><strong>{formatSize(resultSize)}</strong></div>
                <div><span>Thay đổi</span><strong>{(((resultSize - file.size) / file.size) * 100).toFixed(1)}%</strong></div>
              </div>
            )}
            {error && <p className="error-message">{error}</p>}
            <div className="button-row">
              <button className="secondary-button" onClick={() => inputRef.current?.click()}>Đổi file</button>
              <button className="primary-button" onClick={compressPdf} disabled={busy}>
                {busy ? "Đang xử lý..." : "Tối ưu PDF"}
              </button>
            </div>
            {resultUrl && <button className="download-button" onClick={download}>↓ Tải PDF đã tối ưu</button>}
          </div>
        )}
      </div>
      <div className="privacy-box"><strong>🔒 Private by design</strong><span>File chỉ tồn tại trong thời gian xử lý, không lưu database và được xóa sau khi hoàn tất.</span></div>
    </div>
  );
}

export default PdfCompressor;