const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); 

const dbPath = (name) => path.join(__dirname, "data", `${name}.json`);
async function readAll(name) {
  const raw = await fs.readFile(dbPath(name), "utf-8");
  return JSON.parse(raw || "[]");
}
async function writeAll(name, data) {
  await fs.writeFile(dbPath(name), JSON.stringify(data, null, 2), "utf-8");
}

const albumCreateRules = [
  body("title").isString().trim().isLength({ min: 1 }).withMessage("title is required"),
  body("artist").isString().trim().isLength({ min: 1 }).withMessage("artist is required"),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }).withMessage("year must be 1900-2100"),
  body("coverUrl").optional().isString(),
];

const albumUpdateRules = [
  body("title").optional().isString().trim().isLength({ min: 1 }),
  body("artist").optional().isString().trim().isLength({ min: 1 }),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }),
  body("coverUrl").optional().isString(),
];

const reviewCreateRules = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating 1-5 required"),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 }),
  body("userId").optional().isInt({ min: 1 }),
];

const reviewUpdateRules = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 }),
];

async function getAllAlbumsFiltered(qs) {
  const albums = await readAll("albums");
  const { query, genre, year, sortBy, page = 1, limit = 12 } = qs;

  let out = [...albums];

  if (query) {
    const q = String(query).toLowerCase();
    out = out.filter(
      (a) =>
        String(a.title).toLowerCase().includes(q) ||
        String(a.artist).toLowerCase().includes(q)
    );
  }
  if (genre) {
    const g = String(genre).toLowerCase();
    out = out.filter((a) => String(a.genre || "").toLowerCase() === g);
  }
  if (year) {
    out = out.filter((a) => String(a.year) === String(year));
  }

  if (sortBy === "rating")
    out.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  if (sortBy === "newest")
    out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  const p = Number(page) || 1;
  const l = Number(limit) || 12;
  const start = (p - 1) * l;
  const items = out.slice(start, start + l);

  return { total: out.length, page: p, limit: l, items };
}

app.get("/albums", async (req, res, next) => {
  try {
    const data = await getAllAlbumsFiltered(req.query);
    res.status(200).json(data);
  } catch (e) { next(e); }
});

app.get("/albums/:id", async (req, res, next) => {
  try {
    const albums = await readAll("albums");
    const id = Number(req.params.id);
    const album = albums.find((a) => Number(a.id) === id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(album);
  } catch (e) { next(e); }
});

app.post("/albums", albumCreateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const list = await readAll("albums");
    const id = list.length ? Math.max(...list.map((a) => a.id)) + 1 : 1;
    const row = {
      id,
      title: req.body.title,
      artist: req.body.artist,
      genre: req.body.genre || null,
      year: req.body.year || null,
      coverUrl: req.body.coverUrl || "",
      avgRating: req.body.avgRating ?? null,
      ratingsCount: req.body.ratingsCount ?? 0,
    };
    list.push(row);
    await writeAll("albums", list);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.put("/albums/:id", albumUpdateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const list = await readAll("albums");
    const id = Number(req.params.id);
    const idx = list.findIndex((a) => Number(a.id) === id);
    if (idx === -1) return res.status(404).json({ error: "Album not found" });

    list[idx] = { ...list[idx], ...req.body, id };
    await writeAll("albums", list);
    res.status(200).json(list[idx]);
  } catch (e) { next(e); }
});

app.delete("/albums/:id", async (req, res, next) => {
  try {
    const list = await readAll("albums");
    const id = Number(req.params.id);
    const idx = list.findIndex((a) => Number(a.id) === id);
    if (idx === -1) return res.status(404).json({ error: "Album not found" });

    const reviews = await readAll("reviews");
    const remainingReviews = reviews.filter((r) => Number(r.albumId) !== id);
    await writeAll("reviews", remainingReviews);

    list.splice(idx, 1);
    await writeAll("albums", list);
    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});


app.get("/albums/:id/reviews", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reviews = await readAll("reviews");
    const list = reviews.filter((r) => Number(r.albumId) === id);
    res.status(200).json(list);
  } catch (e) { next(e); }
});

app.post("/albums/:id/reviews", reviewCreateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const albumId = Number(req.params.id);
    const albums = await readAll("albums");
    const exists = albums.some((a) => Number(a.id) === albumId);
    if (!exists) return res.status(404).json({ error: "Album not found" });

    const list = await readAll("reviews");
    const id = list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1;
    const row = {
      id,
      albumId,
      userId: req.body.userId || 0,
      rating: Number(req.body.rating),
      headline: req.body.headline || "",
      body: req.body.body || "",
      createdAt: new Date().toISOString(),
    };
    list.push(row);
    await writeAll("reviews", list);

    const albumReviews = list.filter((r) => Number(r.albumId) === albumId);
    const ratingsCount = albumReviews.length;
    const avgRating = Math.round(
      (albumReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / ratingsCount) * 10
    ) / 10;

    const albumIdx = albums.findIndex((a) => Number(a.id) === albumId);
    albums[albumIdx] = { ...albums[albumIdx], ratingsCount, avgRating };
    await writeAll("albums", albums);

    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.put("/reviews/:id", reviewUpdateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const list = await readAll("reviews");
    const id = Number(req.params.id);
    const idx = list.findIndex((r) => Number(r.id) === id);
    if (idx === -1) return res.status(404).json({ error: "Review not found" });

    list[idx] = { ...list[idx], ...req.body, id };
    await writeAll("reviews", list);
    res.status(200).json(list[idx]);
  } catch (e) { next(e); }
});

app.delete("/reviews/:id", async (req, res, next) => {
  try {
    const list = await readAll("reviews");
    const id = Number(req.params.id);
    const idx = list.findIndex((r) => Number(r.id) === id);
    if (idx === -1) return res.status(404).json({ error: "Review not found" });

    const albumId = Number(list[idx].albumId);
    list.splice(idx, 1);
    await writeAll("reviews", list);

    const albums = await readAll("albums");
    const albumIdx = albums.findIndex((a) => Number(a.id) === albumId);
    if (albumIdx !== -1) {
      const albumReviews = list.filter((r) => Number(r.albumId) === albumId);
      const ratingsCount = albumReviews.length;
      const avgRating =
        ratingsCount === 0
          ? null
          : Math.round(
              (albumReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / ratingsCount) * 10
            ) / 10;
      albums[albumIdx] = { ...albums[albumIdx], ratingsCount, avgRating };
      await writeAll("albums", albums);
    }

    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});

app.get("/api", (req, res) => res.json({ ok: true, service: "SoundScope API" }));

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});