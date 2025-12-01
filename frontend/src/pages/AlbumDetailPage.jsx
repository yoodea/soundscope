import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function AlbumDetailPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ rating: "", headline: "", body: "" });
  const [formErrors, setFormErrors] = useState({});

  async function loadData() {
    try {
      setLoading(true);
      const [aRes, rRes] = await Promise.all([
        api.get(`/albums/${id}`),
        api.get(`/albums/${id}/reviews`)
      ]);
      setAlbum(aRes.data);
      setReviews(rRes.data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load album.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  function validate() {
    const errs = {};
    const ratingNum = Number(form.rating);
    if (!form.rating) errs.rating = "Rating is required";
    else if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) errs.rating = "Rating must be 1–5";
    if (form.headline.length > 120) errs.headline = "Max 120 characters";
    if (form.body.length > 2000) errs.body = "Max 2000 characters";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!validate()) return;

    try {
      await api.post(`/albums/${id}/reviews`, {
        rating: Number(form.rating),
        headline: form.headline,
        body: form.body
      });
      setMsg("Review added.");
      setForm({ rating: "", headline: "", body: "" });
      await loadData();
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.error || "Failed to add review.");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!album) return <div>Album not found. <Link to="/">Back</Link></div>;

  return (
    <div>
      <p><Link to="/">← Back to albums</Link></p>
      <h1>{album.title}</h1>
      <p>{album.artist}</p>
      <p>{album.genre} {album.year && <>• {album.year}</>}</p>
      <p>
        Rating: {album.avgRating != null ? `${album.avgRating} (${album.ratingsCount || 0})` : "No rating yet"}
      </p>

      {err && <div style={{ color: "#ff6b6b", marginTop: 8 }}>{err}</div>}
      {msg && <div style={{ color: "#8ff09b", marginTop: 8 }}>{msg}</div>}

      <h2 style={{ marginTop: 24 }}>Reviews</h2>
      {reviews.length === 0 ? (
        <div>No reviews yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {reviews.map((r) => (
            <div key={r._id || r.id} style={{ border: "1px solid #222", borderRadius: 12, padding: 10 }}>
              <div><strong>{r.headline || "(no headline)"}</strong></div>
              <div>Rating: {r.rating}/5</div>
              <div style={{ fontSize: 13, color: "#aaa" }}>
                {r.createdAt && new Date(r.createdAt).toLocaleString()}
              </div>
              <div>{r.body}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Add a review</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 400 }}>
        <div>
          <input
            placeholder="Rating 1–5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          />
          {formErrors.rating && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.rating}</div>}
        </div>
        <div>
          <input
            placeholder="Headline (optional)"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          {formErrors.headline && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.headline}</div>}
        </div>
        <div>
          <textarea
            placeholder="Your thoughts…"
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          {formErrors.body && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{formErrors.body}</div>}
        </div>
        <button type="submit">Submit review</button>
      </form>
    </div>
  );
}