import { useRef, useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

function WordCounter() {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState("");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const lines = text ? text.split("\n").length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((sentence) => sentence.trim()).length : 0;
  const readingTime = words ? Math.ceil(words / 200) : 0;

  const readPdf = async (file) => {
    const document = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n");
  };

  const readFile = async (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "txt") return file.text();
    if (extension === "docx") {
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return result.value;
    }
    if (extension === "pdf") return readPdf(file);
    throw new Error("Định dạng không được hỗ trợ. Vui lòng chọn DOCX, PDF hoặc TXT.");
  };

  const importFile = async (file) => {
    if (!file) return;
    setIsReading(true);
    setError("");
    try {
      const extractedText = await readFile(file);
      setText(extractedText);
      setFileName(file.name);
    } catch (readError) {
      console.error(readError);
      setError(readError.message || "Không thể đọc nội dung file.");
    } finally {
      setIsReading(false);
    }
  };

  const handleFileChange = (event) => {
    importFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    importFile(event.dataTransfer.files?.[0]);
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Không thể copy văn bản trong trình duyệt này.");
    }
  };

  const clear = () => {
    setText("");
    setFileName("");
    setError("");
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div><p className="eyebrow">TEXT ANALYTICS</p><h1>Word Counter</h1><p>Đọc trực tiếp DOCX, PDF hoặc TXT, sau đó đếm và phân tích nội dung ngay trong trình duyệt.</p></div>
        <div className="word-actions"><button className="secondary-button" onClick={handleCopy} disabled={!text}>Copy</button><button className="secondary-button" onClick={clear} disabled={!text}>Xóa</button></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span>Số từ</span><strong>{words}</strong></div>
        <div className="stat-card"><span>Ký tự</span><strong>{characters}</strong></div>
        <div className="stat-card"><span>Không khoảng trắng</span><strong>{charactersNoSpaces}</strong></div>
        <div className="stat-card"><span>Số dòng</span><strong>{lines}</strong></div>
        <div className="stat-card"><span>Số câu</span><strong>{sentences}</strong></div>
        <div className="stat-card"><span>Thời gian đọc</span><strong>{readingTime ? `${readingTime} phút` : "0 phút"}</strong></div>
      </div>

      <div className="tool-card word-editor-card">
        <div className="card-header"><h2>{fileName || "Nội dung văn bản"}</h2><span>{characters} ký tự</span></div>
        <div className="file-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()}>
          <strong>{isReading ? "Đang trích xuất nội dung..." : "Kéo thả file vào đây hoặc chọn file"}</strong>
          <span>Hỗ trợ .docx, .pdf, .txt · xử lý cục bộ</span>
          <input ref={inputRef} type="file" accept=".docx,.pdf,.txt" hidden onChange={handleFileChange} />
        </div>
        <textarea className="word-textarea" value={text} onChange={(event) => { setText(event.target.value); setFileName(""); }} placeholder="Hoặc nhập / dán văn bản của bạn..." />
        {error && <p className="error-message">{error}</p>}
        <div className="editor-footer"><span>{words} từ</span><span>{characters} ký tự</span><span>{lines} dòng</span></div>
      </div>

      <div className="privacy-box"><strong>🔒 Private by design</strong><span>Nội dung file chỉ được đọc trong trình duyệt, không upload và không lưu sau khi đóng tab.</span></div>
    </div>
  );
}

export default WordCounter;
