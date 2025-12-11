const jwt = require("jsonwebtoken");
const User = require("../modules/albums/users/user.model");

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication token missing" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" });
      }

      req.currentUser = user;
      next();
    } catch (err) {
      console.error("requireRole error:", err.message);
      return res.status(500).json({ error: "Authorization error" });
    }
  };
}

module.exports = { requireAuth, requireRole };