import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ title: "", artist: "", genre: "", year: "" });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  async function loadAlbums() {
    try {
      setLoading(true);
      const res = await api.get("/albums");
      setAlbums(res.data.items || res.data); // works both if you return {items:[]} or direct array
    } catch (e) {
      console.error(e);
      setError("Failed to load albums.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  function validateForm() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.artist.trim()) errs.artist = "Artist is required";
    if (form.year && isNaN(Number(form.year))) errs.year = "Year must be a number";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!validateForm()) return;

    try {
      await api.post("/albums", {
        title: form.title,
        artist: form.artist,
        genre: form.genre || null,
        year: form.year ? Number(form.year) : null
      });
      setSuccess("Album created successfully.");
      setForm({ title: "", artist: "", genre: "", year: "" });
      await loadAlbums();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || "Failed to create album.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this album?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/albums/${id}`);
      setSuccess("Album deleted.");
      await loadAlbums();
    } catch (e) {
      console.error(e);
      setError("Failed to delete album.");
    }
  }

  return (
    <div>
      <h1>Albums</h1>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "#8ff09b", marginBottom: 8 }}>{success}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div>
            {albums.length === 0 ? (
              <div>No albums yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #333", padding: 8 }}>Title</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #333", padding: 8 }}>Artist</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #333", padding: 8 }}>Rating</th>
                    <th style={{ borderBottom: "1px solid #333", padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((a) => (
                    <tr key={a._id || a.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid #222", cursor: "pointer" }}
                          onClick={() => navigate(`/albums/${a._id || a.id}`)}>
                        {a.title}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #222" }}>{a.artist}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #222" }}>
                        {a.avgRating != null ? `${a.avgRating} (${a.ratingsCount || 0})` : "—"}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #222" }}>
                        <button onClick={() => handleDelete(a._id || a.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h2>Create Album</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
              <div>
                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                {formErrors.title && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.title}</div>}
              </div>
              <div>
                <input
                  placeholder="Artist"
                  value={form.artist}
                  onChange={(e) => setForm({ ...form, artist: e.target.value })}
                />
                {formErrors.artist && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.artist}</div>}
              </div>
              <div>
                <input
                  placeholder="Genre"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                />
              </div>
              <div>
                <input
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
                {formErrors.year && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.year}</div>}
              </div>
              <button type="submit">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}