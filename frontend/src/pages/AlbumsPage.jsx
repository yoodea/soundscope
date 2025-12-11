import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  const [form, setForm] = useState({ title: "", artist: "", genre: "", year: "" });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  async function loadAlbums(params = {}) {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/albums", {
        params: {
          query: params.query !== undefined ? params.query : (search || undefined),
          genre: params.genre !== undefined ? params.genre : (genre || undefined),
          year: params.year !== undefined ? params.year : (year || undefined),
          sortBy: params.sortBy !== undefined ? params.sortBy : (sortBy || undefined)
        }
      });
      const items = res.data.items || res.data;
      setAlbums(items);
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

  const totalAlbums = albums.length;
  const ratedAlbums = albums.filter((a) => a.ratingsCount > 0).length;
  const communityScore =
    ratedAlbums === 0
      ? "—"
      : (
          albums.reduce((sum, a) => sum + (a.avgRating || 0) * (a.ratingsCount || 0), 0) /
          albums.reduce((sum, a) => sum + (a.ratingsCount || 0), 0)
        ).toFixed(1);

  const topByRating = useMemo(
    () =>
      [...albums]
        .filter((a) => a.avgRating != null)
        .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
        .reverse()
        .slice(0, 6),
    [albums]
  );

  const newest = useMemo(
    () =>
      [...albums]
        .filter((a) => a.year)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        .reverse()
        .slice(0, 6),
    [albums]
  );

  function validateForm() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.artist.trim()) errs.artist = "Artist is required";
    if (form.year && isNaN(Number(form.year))) errs.year = "Year must be a number";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate(e) {
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
    if (!window.confirm("Delete this album and all its reviews?")) return;
    try {
      setSuccess("");
      setError("");
      await api.delete(`/albums/${id}`);
      setSuccess("Album deleted.");
      await loadAlbums();
    } catch (e) {
      console.error(e);
      setError("Failed to delete album.");
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadAlbums({ query: search, genre, year, sortBy });
  }

  const genres = Array.from(
    new Set(albums.map((a) => a.genre).filter(Boolean))
  ).sort();

  return (
    <div>
      {}
      <section className="rzt-hero-grid">
        <div className="rzt-hero-card">
          <div className="rzt-hero-title">Community music rating hub</div>
          <div className="rzt-hero-subtitle">
            SoundScope lets listeners rate albums, write reviews, and discover new music through
            the community.
          </div>
          <div className="rzt-hero-pills">
            <span className="rzt-hero-pill">Album ratings and written reviews</span>
            <span className="rzt-hero-pill">Sort by score and year</span>
            <span className="rzt-hero-pill">Filter by genre</span>
            <span className="rzt-hero-pill">No ads – academic project</span>
          </div>
          <div className="rzt-stats-row">
            <div className="rzt-stat-card">
              <div className="rzt-stat-label">Total albums</div>
              <div className="rzt-stat-value">{totalAlbums}</div>
              <div className="rzt-stat-chip">SoundScope catalog</div>
            </div>
            <div className="rzt-stat-card">
              <div className="rzt-stat-label">With ratings</div>
              <div className="rzt-stat-value">{ratedAlbums}</div>
              <div className="rzt-stat-chip">participating in ranking</div>
            </div>
            <div className="rzt-stat-card">
              <div className="rzt-stat-label">Average community score</div>
              <div className="rzt-stat-value">{communityScore}</div>
              <div className="rzt-stat-chip">based on all reviews</div>
            </div>
          </div>
        </div>

        <div className="rzt-search-card">
          <div style={{ marginBottom: 10, fontSize: 13, color: "#9ca3c9" }}>
            Search in catalog
          </div>
          <form className="rzt-search-row" onSubmit={handleSearchSubmit}>
            <input
              placeholder="Title or artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">By rating</option>
              <option value="newest">By year (new first)</option>
            </select>
          </form>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={handleSearchSubmit}>
              Apply
            </button>
          </div>
          {error && <div className="rzt-msg-error">{error}</div>}
          {success && <div className="rzt-msg-success">{success}</div>}
        </div>
      </section>

      {}
      <section className="rzt-section" id="top">
        <div className="rzt-section-header">
          <div>
            <div className="rzt-section-title">Top by community score</div>
            <div className="rzt-section-caption">
              Albums sorted by average rating and number of reviews.
            </div>
          </div>
          <div className="rzt-section-caption">
            {topByRating.length > 0 ? `Showing: ${topByRating.length}` : "No rated albums yet"}
          </div>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : topByRating.length === 0 ? (
          <div>No albums with ratings yet.</div>
        ) : (
          <div className="rzt-album-grid">
            {topByRating.map((a) => (
              <div
                key={a._id}
                className="rzt-album-card"
                onClick={() => navigate(`/albums/${a._id}`)}
              >
                <div className="rzt-album-meta">
                  <div className="rzt-album-title">{a.title}</div>
                  <div className="rzt-album-artist">{a.artist}</div>
                </div>
                <div className="rzt-album-tags">
                  <span>{a.genre || "No genre"}</span>
                  <span>{a.year || "—"}</span>
                </div>
                <div className="rzt-album-tags">
                  <span className="rzt-album-rating-pill">
                    {a.avgRating != null ? `${a.avgRating.toFixed(1)} ★` : "—"}
                  </span>
                  <span className="rzt-album-count">
                    {a.ratingsCount ? `${a.ratingsCount} ratings` : "no ratings"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section className="rzt-section" id="new">
        <div className="rzt-section-header">
          <div>
            <div className="rzt-section-title">New albums on SoundScope</div>
            <div className="rzt-section-caption">
              Recently added albums, sorted by release year.
            </div>
          </div>
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : newest.length === 0 ? (
          <div>No albums with a year set yet.</div>
        ) : (
          <div className="rzt-album-grid">
            {newest.map((a) => (
              <div
                key={a._id}
                className="rzt-album-card"
                onClick={() => navigate(`/albums/${a._id}`)}
              >
                <div className="rzt-album-meta">
                  <div className="rzt-album-title">{a.title}</div>
                  <div className="rzt-album-artist">{a.artist}</div>
                </div>
                <div className="rzt-album-tags">
                  <span>{a.genre || "No genre"}</span>
                  <span>{a.year || "—"}</span>
                </div>
                <div className="rzt-album-tags">
                  <span className="rzt-album-rating-pill">
                    {a.avgRating != null ? `${a.avgRating.toFixed(1)} ★` : "—"}
                  </span>
                  <span className="rzt-album-count">
                    {a.ratingsCount ? `${a.ratingsCount} ratings` : "no ratings"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>
            {}
            <section className="rzt-section" id="reviews">
        <div className="rzt-section-header">
          <div>
            <div className="rzt-section-title">Albums with reviews</div>
            <div className="rzt-section-caption">
              Overview of albums that already have at least one community rating.
            </div>
          </div>
          <div className="rzt-section-caption">
            {albums.filter((a) => a.ratingsCount > 0).length > 0
              ? `Showing: ${albums.filter((a) => a.ratingsCount > 0).length}`
              : "No rated albums yet"}
          </div>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="rzt-album-grid">
            {albums
              .filter((a) => a.ratingsCount > 0)
              .map((a) => (
                <div
                  key={a._id}
                  className="rzt-album-card"
                  onClick={() => navigate(`/albums/${a._id}`)}
                >
                  <div className="rzt-album-meta">
                    <div className="rzt-album-title">{a.title}</div>
                    <div className="rzt-album-artist">{a.artist}</div>
                  </div>
                  <div className="rzt-album-tags">
                    <span>{a.genre || "No genre"}</span>
                    <span>{a.year || "—"}</span>
                  </div>
                  <div className="rzt-album-tags">
                    <span className="rzt-album-rating-pill">
                      {a.avgRating != null ? `${a.avgRating.toFixed(1)} ★` : "—"}
                    </span>
                    <span className="rzt-album-count">
                      {a.ratingsCount ? `${a.ratingsCount} ratings` : "no ratings"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {}
      {isAdmin && (
        <section className="rzt-admin-panel">
          <div className="rzt-admin-title-row">
            <h2 style={{ margin: 0, fontSize: 16 }}>Admin panel</h2>
            <span className="rzt-admin-badge">Only available for role: admin</span>
          </div>
          <div className="rzt-admin-grid">
            <form className="rzt-admin-form" onSubmit={handleCreate}>
              <input
                placeholder="Album title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {formErrors.title && (
                <div className="rzt-msg-error" style={{ fontSize: 11 }}>
                  {formErrors.title}
                </div>
              )}

              <input
                placeholder="Artist"
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
              />
              {formErrors.artist && (
                <div className="rzt-msg-error" style={{ fontSize: 11 }}>
                  {formErrors.artist}
                </div>
              )}

              <input
                placeholder="Genre (optional)"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />

              <input
                placeholder="Year (optional)"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
              {formErrors.year && (
                <div className="rzt-msg-error" style={{ fontSize: 11 }}>
                  {formErrors.year}
                </div>
              )}

              <button type="submit">Create album</button>
            </form>

            <div className="rzt-admin-list">
              <table>
                <thead>
                  <tr>
                    <th>Album</th>
                    <th>Artist</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((a) => (
                    <tr key={a._id}>
                      <td>{a.title}</td>
                      <td>{a.artist}</td>
                      <td>{a.year || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="rzt-admin-delete-btn"
                          onClick={() => handleDelete(a._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {albums.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#9ca3c9" }}>
                        No albums in the catalog yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}