const express = require("express");
const { validationResult } = require("express-validator");
const Model = require("./model");
const { createRules, updateRules } = require("./validators");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { query, genre, year } = req.query;
    const data = await Model.getAll({ query, genre, year });
    res.status(200).json(data);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await Model.getById(req.params.id);
    if (!row) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(row);
  } catch (e) { next(e); }
});

router.post("/", createRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const created = await Model.addNew(req.body);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put("/:id", updateRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const updated = await Model.updateExisting(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Album not found" });
    res.status(200).json(updated);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const ok = await Model.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "Album not found" });
    res.status(200).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;