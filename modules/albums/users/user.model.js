const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);