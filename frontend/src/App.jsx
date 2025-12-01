import { Routes, Route, Link } from "react-router-dom";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh", background: "#0b0c10", color: "#eee" }}>
      <header style={{ padding: "16px", borderBottom: "1px solid #222", position: "sticky", top: 0, background: "#0b0c10", zIndex: 10 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "20px" }}>
            SoundScope
          </Link>
        </nav>
      </header>

      <main style={{ padding: "16px", maxWidth: "1100px", margin: "0 auto" }}>
        <Routes>
          <Route path="/" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
