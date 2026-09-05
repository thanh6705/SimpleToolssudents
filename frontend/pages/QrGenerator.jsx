import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const qrTypes = [
  {
    id: "url",
    icon: "🌐",
    name: "URL",
    description: "Website hoặc đường dẫn",
  },
  {
    id: "zalo",
    icon: "💬",
    name: "Zalo",
    description: "Link Zalo",
  },
  {
    id: "wifi",
    icon: "📶",
    name: "WiFi",
    description: "Thông tin mạng WiFi",
  },
  {
    id: "card",
    icon: "👤",
    name: "Card",
    description: "Thông tin liên hệ",
  },
  {
    id: "map",
    icon: "📍",
    name: "Map",
    description: "Vị trí trên bản đồ",
  },
  {
    id: "email",
    icon: "✉️",
    name: "Email",
    description: "Email và nội dung",
  },
  {
    id: "text",
    icon: "📝",
    name: "Text",
    description: "Văn bản bất kỳ",
  },
  {
    id: "pay",
    icon: "💳",
    name: "Pay",
    description: "Thông tin thanh toán",
  },
];

function QrGenerator() {
  const canvasRef = useRef(null);

  const [type, setType] = useState("url");
  const [qrData, setQrData] = useState("");
  const [generated, setGenerated] = useState(false);

  const [form, setForm] = useState({
    url: "",
    zalo: "",
    wifiName: "",
    wifiPassword: "",
    wifiSecurity: "WPA",
    name: "",
    phone: "",
    email: "",
    address: "",
    map: "",
    emailTo: "",
    emailSubject: "",
    emailBody: "",
    text: "",
    payName: "",
    payInfo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildQrData = () => {
    switch (type) {
      case "url":
        return form.url.trim();

      case "zalo":
        return form.zalo.trim();

      case "wifi":
        return `WIFI:T:${form.wifiSecurity};S:${escapeWifi(
          form.wifiName
        )};P:${escapeWifi(form.wifiPassword)};;`;

      case "card":
        return `BEGIN:VCARD
VERSION:3.0
FN:${form.name}
TEL:${form.phone}
EMAIL:${form.email}
ADR:${form.address}
END:VCARD`;

      case "map":
        return form.map.trim();

      case "email":
        return `mailto:${form.emailTo}?subject=${encodeURIComponent(
          form.emailSubject
        )}&body=${encodeURIComponent(form.emailBody)}`;

      case "text":
        return form.text;

      case "pay":
        return `Payment
Name: ${form.payName}
Info: ${form.payInfo}`;

      default:
        return "";
    }
  };

  const generateQr = async () => {
    const data = buildQrData();

    if (!data.trim()) {
      alert("Vui lòng nhập thông tin trước khi tạo QR.");
      return;
    }

    setQrData(data);
    setGenerated(true);

    setTimeout(async () => {
      if (!canvasRef.current) return;

      await QRCode.toCanvas(canvasRef.current, data, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    }, 0);
  };

  useEffect(() => {
    if (!generated || !qrData || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, qrData, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  }, [generated, qrData]);

  const downloadQr = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");

    link.download = "simpletools-qr.png";
    link.href = canvasRef.current.toDataURL("image/png");

    link.click();
  };

  const renderForm = () => {
    switch (type) {
      case "url":
        return (
          <Input
            label="Website URL"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        );

      case "zalo":
        return (
          <Input
            label="Zalo link"
            name="zalo"
            value={form.zalo}
            onChange={handleChange}
            placeholder="https://zalo.me/..."
          />
        );

      case "wifi":
        return (
          <>
            <Input
              label="Tên WiFi"
              name="wifiName"
              value={form.wifiName}
              onChange={handleChange}
              placeholder="My WiFi"
            />

            <Input
              label="Mật khẩu"
              name="wifiPassword"
              type="password"
              value={form.wifiPassword}
              onChange={handleChange}
              placeholder="Mật khẩu WiFi"
            />

            <div className="form-group">
              <label>Bảo mật</label>

              <select
                name="wifiSecurity"
                value={form.wifiSecurity}
                onChange={handleChange}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Không mật khẩu</option>
              </select>
            </div>
          </>
        );

      case "card":
        return (
          <>
            <Input
              label="Họ và tên"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />

            <Input
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0901234567"
            />

            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
            />

            <Input
              label="Địa chỉ"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="TP. Hồ Chí Minh"
            />
          </>
        );

      case "map":
        return (
          <Input
            label="Google Maps link"
            name="map"
            value={form.map}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
          />
        );

      case "email":
        return (
          <>
            <Input
              label="Email người nhận"
              name="emailTo"
              value={form.emailTo}
              onChange={handleChange}
              placeholder="example@gmail.com"
            />

            <Input
              label="Tiêu đề"
              name="emailSubject"
              value={form.emailSubject}
              onChange={handleChange}
              placeholder="Tiêu đề email"
            />

            <div className="form-group">
              <label>Nội dung</label>

              <textarea
                name="emailBody"
                value={form.emailBody}
                onChange={handleChange}
                placeholder="Nội dung email..."
                rows="5"
              />
            </div>
          </>
        );

      case "text":
        return (
          <div className="form-group">
            <label>Văn bản</label>

            <textarea
              name="text"
              value={form.text}
              onChange={handleChange}
              placeholder="Nhập nội dung bạn muốn đưa vào QR..."
              rows="7"
            />
          </div>
        );

      case "pay":
        return (
          <>
            <Input
              label="Tên người nhận"
              name="payName"
              value={form.payName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />

            <Input
              label="Thông tin thanh toán"
              name="payInfo"
              value={form.payInfo}
              onChange={handleChange}
              placeholder="Số tài khoản, nội dung thanh toán..."
            />

            <p className="form-note">
              Đây là QR chứa thông tin thanh toán dạng văn bản.
              Không kết nối ngân hàng hoặc dịch vụ thanh toán bên thứ ba.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="qr-page">
      <div className="page-header">
        <div>
          <h2>QR Generator</h2>

          <p>
            Tạo mã QR miễn phí ngay trên trình duyệt.
          </p>
        </div>
      </div>

      <div className="qr-type-grid">
        {qrTypes.map((item) => (
          <button
            key={item.id}
            className={`qr-type-card ${
              type === item.id ? "selected" : ""
            }`}
            onClick={() => {
              setType(item.id);
              setGenerated(false);
            }}
          >
            <span className="qr-type-icon">
              {item.icon}
            </span>

            <span className="qr-type-name">
              {item.name}
            </span>

            <span className="qr-type-description">
              {item.description}
            </span>
          </button>
        ))}
      </div>

      <div className="qr-workspace">
        <section className="qr-form-card">
          <div className="card-title">
            <h3>
              {qrTypes.find((item) => item.id === type)?.icon}{" "}
              {qrTypes.find((item) => item.id === type)?.name}
            </h3>

            <span>Step 1</span>
          </div>

          <div className="qr-form">
            {renderForm()}
          </div>

          <button
            className="generate-button"
            onClick={generateQr}
          >
            Tạo QR Code
          </button>
        </section>

        <section className="qr-preview-card">
          <div className="card-title">
            <h3>Preview</h3>

            <span>Step 2</span>
          </div>

          <div className="qr-preview">
            {generated ? (
              <>
                <div className="qr-canvas-wrapper">
                  <canvas ref={canvasRef}></canvas>
                </div>

                <p className="qr-success">
                  ✓ QR đã được tạo thành công
                </p>

                <button
                  className="download-button"
                  onClick={downloadQr}
                >
                  ↓ Tải QR PNG
                </button>
              </>
            ) : (
              <div className="empty-preview">
                <div>▣</div>

                <p>QR Code sẽ xuất hiện ở đây</p>

                <span>
                  Nhập thông tin và nhấn "Tạo QR Code"
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="privacy-note">
        <strong>🔒 Private by design</strong>

        <span>
          Dữ liệu được xử lý trực tiếp trên trình duyệt.
          Không cần tài khoản và không lưu dữ liệu.
        </span>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function escapeWifi(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

export default QrGenerator;