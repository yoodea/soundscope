const express = require("express");
const { validationResult } = require("express-validator");
const Model = require("./model");
const { createRules, updateRules } = require("./validators");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res, next) => {
  try {
    const data = await Model.getForAlbum(req.params.albumId);
    res.status(200).json(data);
  } catch (e) { next(e); }
});

router.post("/", createRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const row = await Model.addNew({ albumId: req.params.albumId, ...req.body });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

const flat = express.Router();
flat.put("/:id", updateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const updated = await Model.updateExisting(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Review not found" });
    res.status(200).json(updated);
  } catch (e) { next(e); }
});
flat.delete("/:id", async (req, res, next) => {
  try {
    const ok = await Model.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "Review not found" });
    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = { nested: router, flat };