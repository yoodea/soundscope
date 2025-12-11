const { Schema, model, Types } = require("mongoose");

const ReviewSchema = new Schema(
  {
    albumId: { type: Types.ObjectId, ref: "Album", required: true },
    userId: { type: Number, default: 0 }, 
    rating: { type: Number, min: 1, max: 5, required: true },
    headline: { type: String, trim: true, maxlength: 120 },
    body: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

module.exports = model("Review", ReviewSchema);