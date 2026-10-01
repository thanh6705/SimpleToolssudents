import { useEffect, useState } from "react";

let nextCourseId = 1;
const makeCourse = () => ({ id: nextCourseId++, name: "", credits: "", score: "" });
const currentDate = new Date();
const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
const modes = [
  ["focus", "Tập trung"],
  ["short", "Nghỉ ngắn"],
  ["long", "Nghỉ dài"],
];

function downloadText(text, filename, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Productivity() {
  const [tab, setTab] = useState("focus");

  return (
    <div className="tool-page productivity-page">
      <div className="tool-header">
        <div>
          <p className="eyebrow">STUDY & WORK</p>
          <h1>Năng suất</h1>
          <p>Công cụ học tập và công việc gọn nhẹ, dữ liệu được xử lý ngay trên thiết bị.</p>
        </div>
      </div>

      <div className="productivity-tabs" role="tablist" aria-label="Công cụ năng suất">
        <button role="tab" aria-selected={tab === "focus"} className={tab === "focus" ? "active" : ""} onClick={() => setTab("focus")}>Pomodoro</button>
        <button role="tab" aria-selected={tab === "grades"} className={tab === "grades" ? "active" : ""} onClick={() => setTab("grades")}>Điểm trung bình</button>
        <button role="tab" aria-selected={tab === "citation"} className={tab === "citation" ? "active" : ""} onClick={() => setTab("citation")}>Trích dẫn APA</button>
        <button role="tab" aria-selected={tab === "minutes"} className={tab === "minutes" ? "active" : ""} onClick={() => setTab("minutes")}>Biên bản họp</button>
      </div>

      {tab === "focus" && <Pomodoro />}
      {tab === "grades" && <GradeCalculator />}
      {tab === "citation" && <CitationBuilder />}
      {tab === "minutes" && <MeetingMinutes />}

      <div className="privacy-box"><strong>Xử lý cục bộ</strong><span>Nội dung không được gửi lên máy chủ.</span></div>
    </div>
  );
}

function Pomodoro() {
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        window.clearInterval(timer);
        setRunning(false);
        if (mode === "focus") setSessions((count) => count + 1);
        setNotice(mode === "focus" ? "Hoàn thành phiên tập trung. Hãy nghỉ một chút." : "Đã hết giờ nghỉ. Sẵn sàng quay lại công việc.");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [deadline, mode, running]);

  const selectMode = (nextMode) => {
    setRunning(false);
    setMode(nextMode);
    setRemaining(durations[nextMode] * 60);
    setNotice("");
  };

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      setNotice("Đã tạm dừng.");
      return;
    }
    if (remaining === 0) setRemaining(durations[mode] * 60);
    setDeadline(Date.now() + (remaining || durations[mode] * 60) * 1000);
    setNotice("");
    setRunning(true);
  };

  const resetTimer = () => {
    setRunning(false);
    setRemaining(durations[mode] * 60);
    setNotice("");
  };

  const updateDuration = (key, value) => {
    const minutes = Math.min(180, Math.max(1, Number(value) || 1));
    setDurations((current) => ({ ...current, [key]: minutes }));
    if (!running && mode === key) setRemaining(minutes * 60);
  };

  return (
    <section className="tool-card productivity-panel">
      <div className="productivity-panel-heading"><div><h2>Phiên tập trung</h2><p>Chia công việc thành khoảng tập trung và nghỉ ngắn.</p></div><span className="session-count">Hoàn thành: {sessions}</span></div>
      <div className="productivity-tabs mode-tabs" role="tablist" aria-label="Chế độ hẹn giờ">
        {modes.map(([id, label]) => <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? "active" : ""} onClick={() => selectMode(id)}>{label}</button>)}
      </div>
      <div className="timer-face" aria-live="off">
        <strong>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</strong>
        <span>{running ? "Đang chạy" : "Sẵn sàng"}</span>
      </div>
      <div className="timer-actions">
        <button className="primary-button" onClick={toggleTimer}>{running ? "Tạm dừng" : "Bắt đầu"}</button>
        <button className="secondary-button" onClick={resetTimer}>Đặt lại</button>
      </div>
      <div className="duration-settings">
        {modes.map(([id, label]) => <label className="form-group" key={id}><span>{label} (phút)</span><input type="number" min="1" max="180" value={durations[id]} disabled={running && mode === id} onChange={(event) => updateDuration(id, event.target.value)} /></label>)}
      </div>
      {notice && <p className="tool-status" role="status">{notice}</p>}
    </section>
  );
}

function GradeCalculator() {
  const [courses, setCourses] = useState([makeCourse()]);
  const validCourses = courses.filter((course) => course.credits !== "" && course.score !== "" && Number(course.credits) > 0 && Number(course.score) >= 0 && Number(course.score) <= 10);
  const totalCredits = validCourses.reduce((sum, course) => sum + Number(course.credits), 0);
  const average = totalCredits ? validCourses.reduce((sum, course) => sum + Number(course.credits) * Number(course.score), 0) / totalCredits : null;

  const updateCourse = (id, field, value) => setCourses((current) => current.map((course) => course.id === id ? { ...course, [field]: value } : course));
  const removeCourse = (id) => setCourses((current) => current.length > 1 ? current.filter((course) => course.id !== id) : current);

  return (
    <section className="tool-card productivity-panel">
      <div className="productivity-panel-heading"><div><h2>Điểm trung bình có trọng số</h2><p>Nhập điểm hệ 10 và số tín chỉ của từng môn.</p></div></div>
      <div className="grade-list">
        {courses.map((course, index) => <div className="grade-row" key={course.id}>
          <label className="form-group"><span>Môn học {index + 1}</span><input value={course.name} onChange={(event) => updateCourse(course.id, "name", event.target.value)} placeholder="Ví dụ: Toán" /></label>
          <label className="form-group"><span>Tín chỉ</span><input type="number" min="0.5" step="0.5" value={course.credits} onChange={(event) => updateCourse(course.id, "credits", event.target.value)} placeholder="3" /></label>
          <label className="form-group"><span>Điểm (0–10)</span><input type="number" min="0" max="10" step="0.1" value={course.score} onChange={(event) => updateCourse(course.id, "score", event.target.value)} placeholder="8.0" /></label>
          <button className="icon-button" type="button" onClick={() => removeCourse(course.id)} aria-label={`Xóa môn học ${index + 1}`} title="Xóa môn học">×</button>
        </div>)}
      </div>
      <div className="grade-actions"><button className="secondary-button" onClick={() => setCourses((current) => [...current, makeCourse()])}>+ Thêm môn học</button><div className="grade-result"><span>Điểm trung bình hệ 10</span><strong>{average === null ? "—" : average.toFixed(2)}</strong><small>{validCourses.length} môn · {totalCredits} tín chỉ hợp lệ</small></div></div>
      <p className="form-note">Các môn chưa nhập đủ điểm và tín chỉ sẽ chưa được tính. Quy đổi sang GPA hệ 4 tùy quy định từng trường nên chưa tự quy đổi.</p>
    </section>
  );
}

function CitationBuilder() {
  const [type, setType] = useState("website");
  const [form, setForm] = useState({ author: "", year: "", date: "", title: "", source: "", volume: "", issue: "", pages: "", url: "" });
  const [copied, setCopied] = useState(false);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const author = form.author.trim() ? `${form.author.trim()}. ` : "";
  const year = form.year.trim() ? `(${form.year.trim()}${type === "website" && form.date.trim() ? `, ${form.date.trim()}` : ""}). ` : "(n.d.). ";
  let citation = `${author}${year}${form.title.trim() || "Tiêu đề"}.`;
  if (type === "book" && form.source.trim()) citation += ` ${form.source.trim()}.`;
  if (type === "website") {
    if (form.source.trim()) citation += ` ${form.source.trim()}.`;
    if (form.url.trim()) citation += ` ${form.url.trim()}`;
  }
  if (type === "journal") {
    if (form.source.trim()) citation += ` ${form.source.trim()}${form.volume.trim() ? `, ${form.volume.trim()}` : ""}${form.issue.trim() ? `(${form.issue.trim()})` : ""}${form.pages.trim() ? `, ${form.pages.trim()}` : ""}.`;
    if (form.url.trim()) citation += ` https://doi.org/${form.url.trim().replace(/^https?:\/\/(doi\.org\/)?/i, "")}`;
  }

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="tool-card productivity-panel">
      <div className="productivity-panel-heading"><div><h2>Tạo tài liệu tham khảo APA</h2><p>Tạo trích dẫn cơ bản cho sách, trang web hoặc bài báo tạp chí.</p></div></div>
      <div className="productivity-tabs citation-types" role="tablist" aria-label="Loại tài liệu">
        {[ ["website", "Trang web"], ["book", "Sách"], ["journal", "Bài báo"] ].map(([id, label]) => <button key={id} role="tab" aria-selected={type === id} className={type === id ? "active" : ""} onClick={() => setType(id)}>{label}</button>)}
      </div>
      <div className="citation-fields">
        <label className="form-group"><span>Tác giả</span><input name="author" value={form.author} onChange={change} placeholder="Nguyen, A. B." /></label>
        <label className="form-group"><span>Năm xuất bản</span><input name="year" value={form.year} onChange={change} placeholder="2025" /></label>
        {type === "website" && <label className="form-group"><span>Ngày đăng (không bắt buộc)</span><input name="date" value={form.date} onChange={change} placeholder="ngày tháng, ví dụ: March 12" /></label>}
        <label className="form-group"><span>{type === "website" ? "Tiêu đề trang" : type === "book" ? "Tên sách" : "Tên bài báo"}</span><input name="title" value={form.title} onChange={change} placeholder="Tiêu đề tài liệu" /></label>
        <label className="form-group"><span>{type === "website" ? "Tên website" : type === "book" ? "Nhà xuất bản" : "Tên tạp chí"}</span><input name="source" value={form.source} onChange={change} placeholder={type === "book" ? "Nhà xuất bản" : "Tên nguồn"} /></label>
        {type === "journal" && <>
          <label className="form-group"><span>Tập</span><input name="volume" value={form.volume} onChange={change} placeholder="12" /></label>
          <label className="form-group"><span>Số</span><input name="issue" value={form.issue} onChange={change} placeholder="2" /></label>
          <label className="form-group"><span>Trang</span><input name="pages" value={form.pages} onChange={change} placeholder="34–48" /></label>
        </>}
        {(type === "website" || type === "journal") && <label className="form-group citation-url"><span>{type === "journal" ? "DOI hoặc URL" : "URL"}</span><input name="url" value={form.url} onChange={change} placeholder={type === "journal" ? "10.1234/example" : "https://example.com/article"} /></label>}
      </div>
      <div className="citation-output"><span>Bản xem trước</span><p>{citation}</p><button className="secondary-button" onClick={copyCitation}>{copied ? "Đã sao chép" : "Sao chép trích dẫn"}</button></div>
      <p className="form-note">Định dạng APA cơ bản; hãy kiểm tra yêu cầu của giảng viên và bổ sung thông tin còn thiếu trước khi nộp.</p>
    </section>
  );
}

function MeetingMinutes() {
  const [form, setForm] = useState({ title: "", date: today, attendees: "", summary: "", decisions: "", actions: "" });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const exportMinutes = () => {
    const actionItems = form.actions.split("\n").map((item) => item.trim()).filter(Boolean).map((item) => `- [ ] ${item}`).join("\n") || "- Chưa có";
    const content = `# ${form.title.trim() || "Biên bản họp"}\n\n- Ngày: ${form.date || "Chưa ghi"}\n- Người tham dự: ${form.attendees.trim() || "Chưa ghi"}\n\n## Nội dung chính\n${form.summary.trim() || "Chưa ghi"}\n\n## Quyết định\n${form.decisions.trim() || "Chưa ghi"}\n\n## Việc cần làm\n${actionItems}\n`;
    downloadText(content, "bien-ban-hop.md", "text/markdown;charset=utf-8");
  };

  return (
    <section className="tool-card productivity-panel">
      <div className="productivity-panel-heading"><div><h2>Biên bản họp nhanh</h2><p>Ghi lại nội dung, quyết định và các đầu việc tiếp theo.</p></div></div>
      <div className="minutes-fields">
        <label className="form-group"><span>Tiêu đề cuộc họp</span><input name="title" value={form.title} onChange={change} placeholder="Ví dụ: Họp nhóm dự án" /></label>
        <label className="form-group"><span>Ngày họp</span><input type="date" name="date" value={form.date} onChange={change} /></label>
        <label className="form-group minutes-wide"><span>Người tham dự</span><input name="attendees" value={form.attendees} onChange={change} placeholder="Tên, phân cách bằng dấu phẩy" /></label>
        <label className="form-group minutes-wide"><span>Nội dung chính</span><textarea name="summary" value={form.summary} onChange={change} rows="4" placeholder="Các nội dung đã trao đổi..." /></label>
        <label className="form-group minutes-wide"><span>Quyết định</span><textarea name="decisions" value={form.decisions} onChange={change} rows="3" placeholder="Các quyết định đã thống nhất..." /></label>
        <label className="form-group minutes-wide"><span>Việc cần làm (mỗi việc một dòng)</span><textarea name="actions" value={form.actions} onChange={change} rows="4" placeholder="Người phụ trách - đầu việc - hạn hoàn thành" /></label>
      </div>
      <button className="primary-button" onClick={exportMinutes}>Tải biên bản Markdown</button>
    </section>
  );
}

export default Productivity;
