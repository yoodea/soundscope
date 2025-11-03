require("dotenv").config();
const express = require("express");
const path = require("path");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const connectDB = require("./shared/middlewares/connect-db");

const Album = require("./modules/albums/album.model");
const Review = require("./modules/reviews/review.model");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(connectDB);

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

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

app.get("/albums", async (req, res, next) => {
  try {
    const { query, genre, year, sortBy, page = 1, limit = 12 } = req.query;

    const filter = {};
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { artist: { $regex: query, $options: "i" } }
      ];
    }
    if (genre) filter.genre = genre;
    if (year) filter.year = Number(year);

    const sort = {};
    if (sortBy === "rating") sort.avgRating = -1;
    if (sortBy === "newest") sort.year = -1;

    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(Number(limit) || 12, 100));

    const [total, items] = await Promise.all([
      Album.countDocuments(filter),
      Album.find(filter).sort(sort).skip((p - 1) * l).limit(l)
    ]);

    res.status(200).json({ total, page: p, limit: l, items });
  } catch (e) { next(e); }
});

app.get("/albums/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(album);
  } catch (e) { next(e); }
});

app.post("/albums", albumCreateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const album = await Album.create({
      title: req.body.title,
      artist: req.body.artist,
      genre: req.body.genre || null,
      year: req.body.year || null,
      coverUrl: req.body.coverUrl || ""
    });
    res.status(201).json(album);
  } catch (e) { next(e); }
});

app.put("/albums/:id", albumUpdateRules, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const album = await Album.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(album);
  } catch (e) { next(e); }
});

app.delete("/albums/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });

    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    await Review.deleteMany({ albumId: album._id }); 
    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});

app.get("/albums/:id/reviews", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });
    const list = await Review.find({ albumId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (e) { next(e); }
});

app.post("/albums/:id/reviews", reviewCreateRules, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    const review = await Review.create({
      albumId: album._id,
      userId: req.body.userId || 0,
      rating: Number(req.body.rating),
      headline: req.body.headline || "",
      body: req.body.body || ""
    });

    const agg = await Review.aggregate([
      { $match: { albumId: album._id } },
      { $group: { _id: "$albumId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const { avg = null, count = 0 } = agg[0] || {};
    album.avgRating = avg ? Math.round(avg * 10) / 10 : null;
    album.ratingsCount = count;
    await album.save();

    res.status(201).json(review);
  } catch (e) { next(e); }
});

app.put("/reviews/:id", reviewUpdateRules, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Review not found" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ error: "Review not found" });

    const albumId = review.albumId;
    const agg = await Review.aggregate([
      { $match: { albumId } },
      { $group: { _id: "$albumId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const { avg = null, count = 0 } = agg[0] || {};
    await Album.findByIdAndUpdate(albumId, {
      $set: { avgRating: avg ? Math.round(avg * 10) / 10 : null, ratingsCount: count }
    });

    res.status(200).json(review);
  } catch (e) { next(e); }
});

app.delete("/reviews/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Review not found" });

    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const albumId = review.albumId;
    const agg = await Review.aggregate([
      { $match: { albumId } },
      { $group: { _id: "$albumId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const { avg = null, count = 0 } = agg[0] || {};
    await Album.findByIdAndUpdate(albumId, {
      $set: { avgRating: avg ? Math.round(avg * 10) / 10 : null, ratingsCount: count }
    });

    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});

app.get("/api", (req, res) => res.json({ ok: true, service: "SoundScope API (MongoDB)" }));

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});