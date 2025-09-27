const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const loadAlbums = async () => {
  const raw = await fs.readFile(path.join(__dirname, "data", "albums.json"), "utf-8");
  return JSON.parse(raw);
};
const loadReviews = async () => {
  const raw = await fs.readFile(path.join(__dirname, "data", "reviews.json"), "utf-8");
  return JSON.parse(raw);
};

app.get("/albums", async (req, res) => {
  try {
    const albums = await loadAlbums();
    const { query, genre, year, sortBy, page = 1, limit = 12 } = req.query;

    let out = [...albums];

    if (query) {
      const q = String(query).toLowerCase();
      out = out.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q)
      );
    }
    if (genre) {
      const g = String(genre).toLowerCase();
      out = out.filter(a => String(a.genre).toLowerCase() === g);
    }
    if (year) {
      out = out.filter(a => String(a.year) === String(year));
    }

    if (sortBy === "rating") out.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    if (sortBy === "newest") out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    const p = Number(page) || 1;
    const l = Number(limit) || 12;
    const start = (p - 1) * l;
    const paged = out.slice(start, start + l);

    res.json({
      total: out.length,
      page: p,
      limit: l,
      items: paged
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/albums/:id", async (req, res) => {
  try {
    const albums = await loadAlbums();
    const id = Number(req.params.id);
    const album = albums.find(a => Number(a.id) === id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/albums/:id/reviews", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reviews = await loadReviews();
    const list = reviews.filter(r => Number(r.albumId) === id);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/albums/:id/reviews", async (req, res) => {
  const { rating, headline, body } = req.body || {};
  res.status(201).json({
    message: "Review received (Phase 1 demo only; not saved to file).",
    preview: { albumId: Number(req.params.id), rating, headline, body }
  });
});

app.get("/api", (req, res) => res.json({ ok: true, service: "SoundScope API" }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});