const express = require("express");

function createHealthRoutes({ instanceId, sessionRepository, rateLimiter }) {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    res.json({
      status: "ok",
      instance: instanceId,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      sockets: await sessionRepository.count(),
      connPerIP: rateLimiter.activeIpCount(),
    });
  });

  return router;
}

module.exports = createHealthRoutes;
