module.exports = (req, res, next) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  };