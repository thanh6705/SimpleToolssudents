import { NavLink } from "react-router-dom";

const tools = [
  {
    path: "/pdf-merger",
    name: "PDF Merger",
    icon: "📄",
  },
  {
    path: "/pdf-compressor",
    name: "PDF Compressor",
    icon: "🗜️",
  },
  {
    path: "/image-compressor",
    name: "Image Compressor",
    icon: "📦",
  },
  {
    path: "/image-resizer",
    name: "Image Resizer",
    icon: "📐",
  },
  {
    path: "/qr-generator",
    name: "QR Generator",
    icon: "▣",
  },
  {
    path: "/word-counter",
    name: "Word Counter",
    icon: "📝",
  },
  {
    path: "/text-cleaner",
    name: "Text Cleaner",
    icon: "🧹",
  },
];

function Sidebar({ darkMode, onToggleTheme }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <span className="logo-icon">🛠️</span>

        <h1>SimpleTools</h1>
      </div>

      {/* Tools */}
      <nav className="tools-nav">
        {tools.map((tool) => (
          <NavLink
            key={tool.path}
            to={tool.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">
              {tool.icon}
            </span>

            <span className="nav-name">
              {tool.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span>{darkMode ? "☀" : "☾"}</span>
          {darkMode ? "Chế độ sáng" : "Chế độ tối"}
        </button>
        <p>Free · Private · Simple</p>
      </div>
    </aside>
  );
}

export default Sidebar;