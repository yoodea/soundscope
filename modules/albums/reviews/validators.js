const { body } = require("express-validator");

const createRules = [
  body("rating").isInt({ min: 1, max: 5 }),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 }),
  body("userId").optional().isInt({ min: 1 })
];

const updateRules = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("headline").optional().isString().isLength({ max: 120 }),
  body("body").optional().isString().isLength({ max: 2000 })
];

module.exports = { createRules, updateRules };