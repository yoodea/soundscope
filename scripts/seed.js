require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const Album = require("../modules/albums/album.model");
const Review = require("../modules/reviews/review.model");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "soundscope" });

  const albumsRaw = await fs.readFile(path.join(__dirname, "..", "data", "albums.json"), "utf8");
  const reviewsRaw = await fs.readFile(path.join(__dirname, "..", "data", "reviews.json"), "utf8");
  const albums = JSON.parse(albumsRaw || "[]");
  const reviews = JSON.parse(reviewsRaw || "[]");

  await Album.deleteMany({});
  await Review.deleteMany({});

  const inserted = await Album.insertMany(albums.map(a => ({ ...a, _id: undefined })));
  const idMap = new Map();
  inserted.forEach((a, i) => idMap.set(albums[i].id, a._id));

  await Review.insertMany(
    reviews.map(r => ({ ...r, albumId: idMap.get(r.albumId), id: undefined }))
  );

  console.log("Seed complete");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });