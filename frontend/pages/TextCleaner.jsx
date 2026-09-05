import { useState } from "react";

function TextCleaner() {
  const [text, setText] = useState("");
  const [options, setOptions] = useState({ spaces: true, lines: true, trim: true });

  const cleanText = () => {
    let cleaned = text.replace(/\r\n/g, "\n");
    if (options.spaces) cleaned = cleaned.replace(/[ \t]+/g, " ");
    if (options.trim) cleaned = cleaned.split("\n").map((line) => line.trim()).join("\n");
    if (options.lines) cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    setText(cleaned.trim());
  };

  const toggle = (name) => setOptions((current) => ({ ...current, [name]: !current[name] }));
  const copyText = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div><p className="eyebrow">TEXT WORKSPACE</p><h1>Text Cleaner</h1><p>Làm sạch văn bản nhanh, gọn và không rời khỏi trình duyệt.</p></div>
        <div className="word-actions"><button className="secondary-button" onClick={copyText} disabled={!text}>Copy</button><button className="secondary-button" onClick={() => setText("")} disabled={!text}>Xóa</button></div>
      </div>
      <div className="cleaner-grid">
        <div className="tool-card">
          <div className="card-header"><h2>Văn bản gốc</h2><span>{text.length} ký tự</span></div>
          <textarea className="word-textarea cleaner-textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Dán văn bản cần làm sạch vào đây..." />
        </div>
        <div className="tool-card cleaner-settings">
          <h2>Quy tắc làm sạch</h2>
          <p className="muted-text">Chọn các thay đổi muốn áp dụng.</p>
          <label className="toggle-row"><input type="checkbox" checked={options.spaces} onChange={() => toggle("spaces")} /><span>Gộp khoảng trắng liên tiếp</span></label>
          <label className="toggle-row"><input type="checkbox" checked={options.lines} onChange={() => toggle("lines")} /><span>Giảm dòng trống liên tiếp</span></label>
          <label className="toggle-row"><input type="checkbox" checked={options.trim} onChange={() => toggle("trim")} /><span>Xóa khoảng trắng đầu/cuối dòng</span></label>
          <button className="primary-button full-width" onClick={cleanText} disabled={!text}>Làm sạch văn bản</button>
          <div className="cleaner-preview"><span>Đầu ra hiện tại</span><strong>{text ? `${text.split(/\s+/).filter(Boolean).length} từ` : "Chưa có nội dung"}</strong></div>
        </div>
      </div>
      <div className="privacy-box"><strong>🔒 Private by design</strong><span>Văn bản chỉ nằm trong bộ nhớ tạm của trình duyệt, không có tài khoản và không lưu dữ liệu.</span></div>
    </div>
  );
}

export default TextCleaner;