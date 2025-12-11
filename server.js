require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Album = require("./modules/albums/album.model");
const Review = require("./modules/albums/reviews/review.model");
const User = require("./modules/albums/users/user.model");

const connectDB = require("./middlewares/connect-db");
const { sendOtpEmail } = require("./shared/email-service");
const { requireAuth, requireRole } = require("./shared/auth-middleware");;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(connectDB);

const albumCreateRules = [
  body("title").isString().trim().isLength({ min: 1 }).withMessage("title is required"),
  body("artist").isString().trim().isLength({ min: 1 }).withMessage("artist is required"),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }).withMessage("year must be 1900-2100"),
  body("coverUrl").optional().isString()
];

const albumUpdateRules = [
  body("title").optional().isString().trim().isLength({ min: 1 }),
  body("artist").optional().isString().trim().isLength({ min: 1 }),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }),
  body("coverUrl").optional().isString()
];

const reviewCreateRules = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating 1-5 required"),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 })
];

const reviewUpdateRules = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 })
];

const authRegisterRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["user", "admin"]).withMessage("Invalid role")
];

const authLoginRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 1 }).withMessage("Password required")
];

const otpVerifyRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("otp").isLength({ min: 4, max: 10 }).withMessage("OTP required")
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.post("/auth/register", authRegisterRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, role = "user" } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email: email.toLowerCase(), passwordHash, role });

    res.status(201).json({
      message: "User registered",
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

app.post("/auth/login", authLoginRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const otpCode = String(Math.floor(100000 + Math.random() * 900000)); 
    const expires = new Date(Date.now() + 5 * 60 * 1000); 

    user.otpCode = otpCode;
    user.otpExpiresAt = expires;
    await user.save();

    await sendOtpEmail(user.email, otpCode);

    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete login."
    });
  } catch (err) {
    next(err);
  }
});

app.post("/auth/verify-otp", otpVerifyRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpCode) return res.status(400).json({ error: "OTP not found. Please login again." });

    if (user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired. Please login again." });
    }

    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

app.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -otpCode -otpExpiresAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

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
  } catch (e) {
    next(e);
  }
});

app.get("/albums/:id", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(album);
  } catch (e) {
    next(e);
  }
});

app.post("/albums", requireAuth, requireRole("admin"), albumCreateRules, async (req, res, next) => {
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
  } catch (e) {
    next(e);
  }
});

app.put("/albums/:id", requireAuth, requireRole("admin"), albumUpdateRules, async (req, res, next) => {
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
  } catch (e) {
    next(e);
  }
});

app.delete("/albums/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });

    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    await Review.deleteMany({ albumId: album._id });
    res.status(200).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.get("/albums/:id/reviews", async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });
    const list = await Review.find({ albumId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (e) {
    next(e);
  }
});

app.post("/albums/:id/reviews", requireAuth, reviewCreateRules, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: "Album not found" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    const review = await Review.create({
      albumId: album._id,
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
  } catch (e) {
    next(e);
  }
});

app.put("/reviews/:id", requireAuth, requireRole("admin"), reviewUpdateRules, async (req, res, next) => {
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
  } catch (e) {
    next(e);
  }
});

app.delete("/reviews/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
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
  } catch (e) {
    next(e);
  }
});

app.get("/api", (req, res) =>
  res.json({ ok: true, service: "SoundScope API (MongoDB + Auth + OTP)" })
);

app.use((req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});