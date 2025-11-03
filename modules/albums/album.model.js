const { Schema, model } = require("mongoose");

const AlbumSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    genre: { type: String, trim: true },
    year: { type: Number, min: 1900, max: 2100 },
    coverUrl: { type: String, default: "" },
    avgRating: { type: Number, min: 0, max: 5, default: null },
    ratingsCount: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

module.exports = model("Album", AlbumSchema);