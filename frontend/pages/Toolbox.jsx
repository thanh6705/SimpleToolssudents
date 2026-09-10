import { useMemo, useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const tabs = [
  ["pdf", "PDF nâng cao", "📄"],
  ["image", "Hình ảnh", "🖼"],
  ["text", "Văn bản", "✍"],
  ["security", "Mật khẩu", "🔐"],
  ["convert", "Tính toán", "⇄"],
  ["data", "Dữ liệu", "{ }"],
  ["utility", "Tiện ích", "◷"],
];

function downloadBlob(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function downloadText(value, name, type = "text/plain") {
  downloadBlob(new Blob([value], { type }), name);
}

function Field({ label, as, children, ...props }) {
  const Control = as || "input";
  return <label className="form-group"><span>{label}</span><Control {...props}>{children}</Control></label>;
}

function PdfTools() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState("");
  const [order, setOrder] = useState("");
  const [angle, setAngle] = useState("90");
  const [status, setStatus] = useState("");
  const inputRef = useRef(null);

  const readPdf = async () => {
    if (!file) throw new Error("Hãy chọn một file PDF trước.");
    return PDFDocument.load(await file.arrayBuffer());
  };
  const parsePages = (value, max) => {
    const result = [];
    value.split(",").forEach((part) => {
      const [start, end] = part.trim().split("-").map(Number);
      if (!start) return;
      for (let page = start; page <= (end || start) && page <= max; page += 1) if (page > 0 && !result.includes(page - 1)) result.push(page - 1);
    });
    return result;
  };
  const savePdf = async (action) => {
    try {
      const source = await readPdf();
      const output = await PDFDocument.create();
      let indexes = [...Array(source.getPageCount()).keys()];
      if (action === "split") indexes = parsePages(pages, source.getPageCount());
      if (action === "reorder") indexes = parsePages(order, source.getPageCount());
      if (!indexes.length) throw new Error("Chưa có số trang hợp lệ.");
      const copied = await output.copyPages(source, indexes);
      copied.forEach((page) => { if (action === "rotate") page.setRotation(degrees(Number(angle))); output.addPage(page); });
      const bytes = await output.save();
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), `simpletools-${action}.pdf`);
      setStatus(`Đã tạo file ${action === "split" ? "PDF tách trang" : action === "rotate" ? "PDF xoay trang" : "PDF mới"}.`);
    } catch (error) { setStatus(error.message); }
  };
  const extractText = async (format) => {
    try {
      if (!file) throw new Error("Hãy chọn một file PDF trước.");
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const chunks = [];
      for (let index = 1; index <= doc.numPages; index += 1) { const page = await doc.getPage(index); const content = await page.getTextContent(); chunks.push(content.items.map((item) => item.str).join(" ")); }
      const text = chunks.join("\n\n");
      downloadText(format === "csv" ? `page,text\n${chunks.map((item, index) => `${index + 1},"${item.replaceAll('"', '""')}"`).join("\n")}` : text, format === "csv" ? "pdf-pages.csv" : "pdf-to-word.doc", format === "csv" ? "text/csv" : "application/msword");
      setStatus(`Đã xuất nội dung PDF sang ${format === "csv" ? "Excel/CSV" : "Word"}.`);
    } catch (error) { setStatus(error.message); }
  };
  return <ToolPanel title="PDF nâng cao" description="Tách, xoay, sắp xếp và xuất nội dung PDF ngay trên máy của bạn.">
    <div className="tool-card-inner">
      <div className="file-drop-zone" onClick={() => inputRef.current?.click()}><strong>{file ? file.name : "Chọn PDF để bắt đầu"}</strong><span>Không tải file lên máy chủ</span><input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(event) => setFile(event.target.files?.[0])} /></div>
      <div className="tool-grid-2"><Field label="Trang cần tách (vd: 1,3-5)" value={pages} onChange={(event) => setPages(event.target.value)} placeholder="1, 3-5" /><Field label="Thứ tự mới (vd: 3,1,2)" value={order} onChange={(event) => setOrder(event.target.value)} placeholder="3, 1, 2" /></div>
      <div className="tool-button-grid"><button className="primary-button" onClick={() => savePdf("split")}>Tách PDF</button><button className="secondary-button" onClick={() => savePdf("reorder")}>Sắp xếp trang</button><button className="secondary-button" onClick={() => savePdf("rotate")}>Xoay tất cả {angle}°</button><select value={angle} onChange={(event) => setAngle(event.target.value)}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>
      <div className="tool-button-grid"><button className="secondary-button" onClick={() => extractText("doc")}>PDF → Word</button><button className="secondary-button" onClick={() => extractText("csv")}>PDF → Excel</button></div>
      {status && <p className="tool-status">{status}</p>}
    </div>
  </ToolPanel>;
}

function ImageTools() {
  const [file, setFile] = useState(null); const [format, setFormat] = useState("image/png"); const [text, setText] = useState(""); const [opacity, setOpacity] = useState(0.55); const [mode, setMode] = useState("convert"); const [crop, setCrop] = useState({ width: 800, height: 800 }); const canvasRef = useRef(null);
  const process = () => { if (!file) return; const image = new Image(); image.onload = () => { const canvas = canvasRef.current; const width = mode === "crop" ? Math.min(Number(crop.width), image.width) : image.width; const height = mode === "crop" ? Math.min(Number(crop.height), image.height) : image.height; canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); if (mode === "transparent") { ctx.drawImage(image, 0, 0, width, height); const pixels = ctx.getImageData(0, 0, width, height); for (let index = 0; index < pixels.data.length; index += 4) { if (pixels.data[index] > 235 && pixels.data[index + 1] > 235 && pixels.data[index + 2] > 235) pixels.data[index + 3] = 0; } ctx.putImageData(pixels, 0, 0); } else { ctx.drawImage(image, 0, 0, width, height, 0, 0, width, height); } if (text) { ctx.globalAlpha = opacity; ctx.fillStyle = "#ffffff"; ctx.font = `${Math.max(18, width / 24)}px sans-serif`; ctx.fillText(text, 24, height - 30); } canvas.toBlob((blob) => downloadBlob(blob, `simpletools-image.${format.split("/")[1]}`), format, 0.9); }; image.src = URL.createObjectURL(file); };
  const makeBase64 = async () => { if (!file) return; const reader = new FileReader(); reader.onload = () => downloadText(reader.result, "image-base64.txt"); reader.readAsDataURL(file); };
  return <ToolPanel title="Hình ảnh" description="Đổi định dạng, cắt ảnh, tạo nền trong suốt, thêm watermark và mã hóa ảnh thành Base64."><div className="tool-card-inner"><Field label="File ảnh" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0])} /><div className="segmented"><button className={mode === "convert" ? "selected" : ""} onClick={() => setMode("convert")}>Đổi định dạng</button><button className={mode === "crop" ? "selected" : ""} onClick={() => setMode("crop")}>Cắt chuẩn</button><button className={mode === "transparent" ? "selected" : ""} onClick={() => setMode("transparent")}>Nền trong suốt</button><button className={mode === "watermark" ? "selected" : ""} onClick={() => setMode("watermark")}>Chèn chữ / hình mờ</button><button className={mode === "signature" ? "selected" : ""} onClick={() => setMode("signature")}>Ảnh chữ ký</button></div>{mode === "convert" && <Field label="Định dạng đầu ra" value={format} onChange={(event) => setFormat(event.target.value)} as="select"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></Field>}{mode === "crop" && <div className="tool-grid-2"><Field label="Chiều rộng" type="number" value={crop.width} onChange={(event) => setCrop({ ...crop, width: event.target.value })} /><Field label="Chiều cao" type="number" value={crop.height} onChange={(event) => setCrop({ ...crop, height: event.target.value })} /></div>}{mode === "watermark" || mode === "signature" ? <><Field label="Nội dung đóng dấu" value={text} onChange={(event) => setText(event.target.value)} placeholder="Đã ký bởi..." /><Field label="Độ trong suốt" type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(event.target.value)} /></> : null}<div className="tool-button-grid"><button className="primary-button" onClick={process} disabled={!file}>{mode === "signature" ? "Tạo ảnh chữ ký" : "Xử lý & tải ảnh"}</button><button className="secondary-button" onClick={makeBase64} disabled={!file}>Ảnh → Base64</button></div><canvas ref={canvasRef} hidden /></div></ToolPanel>;
}

function UtilityTools() {
  const [url, setUrl] = useState(""); const [cleanUrl, setCleanUrl] = useState(""); const [list, setList] = useState(""); const [seconds, setSeconds] = useState(60); const [remaining, setRemaining] = useState(0); const timerRef = useRef(null);
  const cleanLink = () => { try { const parsed = new URL(url); ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].forEach((key) => parsed.searchParams.delete(key)); setCleanUrl(parsed.toString()); } catch { setCleanUrl("URL không hợp lệ."); } };
  const shuffle = () => setList(list.split("\n").filter(Boolean).sort(() => Math.random() - 0.5).join("\n"));
  const startTimer = () => { clearInterval(timerRef.current); setRemaining(Number(seconds)); timerRef.current = setInterval(() => setRemaining((value) => { if (value <= 1) { clearInterval(timerRef.current); return 0; } return value - 1; }), 1000); };
  return <ToolPanel title="Tiện ích" description="Làm sạch liên kết, xáo trộn danh sách và sử dụng đồng hồ bấm giờ / đếm ngược."><div className="tool-card-inner"><h2>Liên kết</h2><div className="tool-button-grid"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/?utm_source=..." /><button className="primary-button" onClick={cleanLink}>Xóa tham số theo dõi</button></div>{cleanUrl && <div className="result-code">{cleanUrl}</div>}<div className="divider" /><h2>Danh sách ngẫu nhiên</h2><textarea className="word-textarea compact" value={list} onChange={(event) => setList(event.target.value)} placeholder="Mỗi mục một dòng..." /><button className="secondary-button" onClick={shuffle}>Xáo trộn danh sách</button><div className="divider" /><h2>Đếm ngược</h2><div className="tool-button-grid"><input type="number" min="1" value={seconds} onChange={(event) => setSeconds(event.target.value)} /><button className="primary-button" onClick={startTimer}>Bắt đầu</button><strong className="result-code">{remaining ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Sẵn sàng"}</strong></div></div></ToolPanel>;
}

function TextTools() {
  const [text, setText] = useState(""); const [result, setResult] = useState(""); const [mode, setMode] = useState("upper");
  const transform = () => { let value = text; if (mode === "upper") value = value.toUpperCase(); if (mode === "lower") value = value.toLowerCase(); if (mode === "title") value = value.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()); if (mode === "slug") value = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase(); if (mode === "remove") value = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s\n]/g, ""); if (mode === "shuffle") value = value.split("\n").sort(() => Math.random() - 0.5).join("\n"); setResult(value.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n")); };
  return <ToolPanel title="Văn bản" description="Biến đổi kiểu chữ, bỏ dấu, dọn văn bản, xáo trộn danh sách và so sánh nội dung."><div className="tool-card-inner"><div className="tool-grid-2"><textarea className="word-textarea compact" value={text} onChange={(event) => setText(event.target.value)} placeholder="Văn bản đầu vào..." /><textarea className="word-textarea compact" value={result} readOnly placeholder="Kết quả..." /></div><div className="tool-button-grid"><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="upper">IN HOA</option><option value="lower">in thường</option><option value="title">In Đầu Từ</option><option value="slug">Tạo slug không dấu</option><option value="remove">Bỏ dấu & ký tự đặc biệt</option><option value="shuffle">Xáo trộn danh sách</option></select><button className="primary-button" onClick={transform}>Thực hiện</button><button className="secondary-button" onClick={() => downloadText(result, "text-result.txt")} disabled={!result}>Tải kết quả</button></div><div className="compare-box"><strong>So sánh nhanh</strong><textarea className="word-textarea compact" placeholder="Dán bản thứ hai để xem khác biệt..." onChange={(event) => setResult(`${result}\n\n--- Bản 2 ---\n${event.target.value}`)} /></div></div></ToolPanel>;
}

function SecurityTools() {
  const [length, setLength] = useState(16); const [password, setPassword] = useState(""); const [input, setInput] = useState(""); const [encoded, setEncoded] = useState(""); const generate = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"; setPassword(Array.from({ length: Number(length) }, () => chars[Math.floor(Math.random() * chars.length)]).join("")); }; const encode = () => setEncoded(btoa(unescape(encodeURIComponent(input)))); const decode = () => { try { setEncoded(decodeURIComponent(escape(atob(input)))) } catch { setEncoded("Chuỗi Base64 không hợp lệ."); } }; const strength = input.length > 14 && /[A-Z]/.test(input) && /\d/.test(input) && /[^\w]/.test(input) ? "Mạnh" : input.length > 8 ? "Trung bình" : "Yếu";
  return <ToolPanel title="Mật khẩu & an toàn" description="Tạo mật khẩu mạnh, kiểm tra độ an toàn và mã hóa văn bản Base64."><div className="tool-card-inner"><div className="tool-grid-2"><div><Field label={`Độ dài: ${length}`} type="range" min="8" max="40" value={length} onChange={(event) => setLength(event.target.value)} /><button className="primary-button full-width" onClick={generate}>Tạo mật khẩu</button>{password && <div className="result-code">{password}</div>}</div><div><Field label="Kiểm tra mật khẩu" type="password" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập mật khẩu..." /><p className={`strength strength-${strength.toLowerCase()}`}>{input ? `Độ mạnh: ${strength}` : "Chưa có mật khẩu"}</p></div></div><div className="divider" /><textarea className="word-textarea compact" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Văn bản cần mã hóa hoặc chuỗi Base64 cần giải mã..." /><div className="tool-button-grid"><button className="primary-button" onClick={encode}>Mã hóa Base64</button><button className="secondary-button" onClick={decode}>Giải mã Base64</button></div><textarea className="word-textarea compact" value={encoded} readOnly placeholder="Kết quả mã hóa / giải mã..." /></div></ToolPanel>;
}

function ConvertTools() {
  const [category, setCategory] = useState("length"); const [value, setValue] = useState(1); const [percent, setPercent] = useState(100); const [dateA, setDateA] = useState(""); const [dateB, setDateB] = useState(""); const [result, setResult] = useState("");
  const calculate = () => { const number = Number(value); if (category === "length") setResult(`${number} cm = ${(number / 2.54).toFixed(3)} inch = ${(number / 100).toFixed(3)} m`); if (category === "weight") setResult(`${number} kg = ${(number * 1000).toFixed(2)} g = ${(number * 2.20462).toFixed(2)} lb`); if (category === "temperature") setResult(`${number}°C = ${(number * 9 / 5 + 32).toFixed(2)}°F`); if (category === "percent") setResult(`${percent}% của ${number} = ${(number * percent / 100).toFixed(2)} · giảm còn ${(number * (1 - percent / 100)).toFixed(2)}`); if (category === "date" && dateA && dateB) setResult(`${Math.abs((new Date(dateB) - new Date(dateA)) / 86400000)} ngày giữa hai mốc`); };
  return <ToolPanel title="Tính toán & chuyển đổi" description="Đơn vị đo, phần trăm, ngày tháng và các phép tính nhanh thường dùng."><div className="tool-card-inner"><div className="segmented"><button className={category === "length" ? "selected" : ""} onClick={() => setCategory("length")}>Độ dài</button><button className={category === "weight" ? "selected" : ""} onClick={() => setCategory("weight")}>Khối lượng</button><button className={category === "temperature" ? "selected" : ""} onClick={() => setCategory("temperature")}>Nhiệt độ</button><button className={category === "percent" ? "selected" : ""} onClick={() => setCategory("percent")}>Phần trăm</button><button className={category === "date" ? "selected" : ""} onClick={() => setCategory("date")}>Ngày tháng</button></div>{category !== "date" ? <div className="tool-grid-2"><Field label={category === "percent" ? "Giá trị gốc" : "Giá trị đầu vào"} type="number" value={value} onChange={(event) => setValue(event.target.value)} />{category === "percent" && <Field label="Phần trăm" type="number" value={percent} onChange={(event) => setPercent(event.target.value)} />}</div> : <div className="tool-grid-2"><Field label="Ngày bắt đầu" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} /><Field label="Ngày kết thúc" type="date" value={dateB} onChange={(event) => setDateB(event.target.value)} /></div>}<button className="primary-button" onClick={calculate}>Tính kết quả</button>{result && <div className="result-code">{result}</div>}</div></ToolPanel>;
}

function DataTools() {
  const [input, setInput] = useState(""); const [output, setOutput] = useState(""); const [mode, setMode] = useState("pretty"); const convert = () => { try { if (mode === "pretty") setOutput(JSON.stringify(JSON.parse(input), null, 2)); if (mode === "csv") { const rows = JSON.parse(input); const keys = Object.keys(rows[0]); setOutput([keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n")); } if (mode === "json") { const [head, ...rows] = input.trim().split("\n").map((row) => row.split(",")); setOutput(JSON.stringify(rows.map((row) => Object.fromEntries(head.map((key, index) => [key, row[index]]))), null, 2)); } } catch { setOutput("Không thể phân tích dữ liệu. Kiểm tra lại JSON/CSV."); } }; const random = () => setOutput(crypto.randomUUID());
  return <ToolPanel title="Dữ liệu & lập trình" description="Định dạng JSON, đổi JSON ↔ CSV, tạo mã định danh và chuỗi ngẫu nhiên."><div className="tool-card-inner"><div className="segmented"><button className={mode === "pretty" ? "selected" : ""} onClick={() => setMode("pretty")}>JSON đẹp</button><button className={mode === "csv" ? "selected" : ""} onClick={() => setMode("csv")}>JSON → CSV</button><button className={mode === "json" ? "selected" : ""} onClick={() => setMode("json")}>CSV → JSON</button></div><textarea className="word-textarea compact" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Dán JSON hoặc CSV..." /><div className="tool-button-grid"><button className="primary-button" onClick={convert}>Chuyển đổi</button><button className="secondary-button" onClick={random}>Tạo UUID</button><button className="secondary-button" onClick={() => downloadText(output, "data-result.txt")} disabled={!output}>Tải kết quả</button></div><textarea className="word-textarea compact" value={output} readOnly placeholder="Kết quả..." /></div></ToolPanel>;
}

function ToolPanel({ title, description, children }) { return <div className="tool-page"><div className="tool-header"><div><p className="eyebrow">SIMPLETOOLS WORKSPACE</p><h1>{title}</h1><p>{description}</p></div></div>{children}<div className="privacy-box"><strong>🔒 Xử lý cục bộ</strong><span>Dữ liệu của bạn chỉ được xử lý trong trình duyệt này.</span></div></div>; }

function Toolbox() { const [tab, setTab] = useState("pdf"); const Component = useMemo(() => ({ pdf: PdfTools, image: ImageTools, text: TextTools, security: SecurityTools, convert: ConvertTools, data: DataTools, utility: UtilityTools }[tab]), [tab]); return <div className="toolbox-page"><div className="toolbox-tabs">{tabs.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}</div><Component /></div>; }

export default Toolbox;
