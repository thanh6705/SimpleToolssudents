import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "../components/Layout";

import PdfMerger from "../pages/PdfMerger";
import PdfCompressor from "../pages/PdfCompressor";
import ImageCompressor from "../pages/ImageCompressor";
import ImageResizer from "../pages/ImageResizer";
import QrGenerator from "../pages/QrGenerator";
import WordCounter from "../pages/WordCounter";
import TextCleaner from "../pages/TextCleaner";
import FileConverter from "../pages/FileConverter";
import Toolbox from "../pages/Toolbox";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Trang mặc định */}
          <Route
            index
            element={<Navigate to="/pdf-merger" replace />}
          />

          {/* 8 tools */}
          <Route
            path="pdf-merger"
            element={<PdfMerger />}
          />
           <Route
  path="file-converter"
  element={<FileConverter />}
/>
          <Route
            path="pdf-compressor"
            element={<PdfCompressor />}
          />

          <Route
            path="image-compressor"
            element={<ImageCompressor />}
          />

          <Route
            path="image-resizer"
            element={<ImageResizer />}
          />

          <Route
            path="qr-generator"
            element={<QrGenerator />}
          />

          <Route
            path="word-counter"
            element={<WordCounter />}
          />

          <Route
            path="text-cleaner"
            element={<TextCleaner />}
          />
          <Route
            path="toolbox"
            element={<Toolbox />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;