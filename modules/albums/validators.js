const { body } = require("express-validator");

const createRules = [
  body("title").isString().trim().isLength({ min: 1 }),
  body("artist").isString().trim().isLength({ min: 1 }),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }),
  body("coverUrl").optional().isString()
];

const updateRules = [
  body("title").optional().isString().trim().isLength({ min: 1 }),
  body("artist").optional().isString().trim().isLength({ min: 1 }),
  body("genre").optional().isString(),
  body("year").optional().isInt({ min: 1900, max: 2100 }),
  body("coverUrl").optional().isString()
];

module.exports = { createRules, updateRules };