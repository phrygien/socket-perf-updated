function createRequireDebugKey({ debugKey, safeEqual }) {
  return function requireDebugKey(req, res, next) {
    const given = req.get("x-debug-key");
    if (!debugKey || !given || !safeEqual(given, debugKey)) {
      return res.status(404).json({ error: "Not found" });
    }
    next();
  };
}

module.exports = createRequireDebugKey;
