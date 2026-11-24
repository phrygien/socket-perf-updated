const express = require("express");

function createApp({
  instanceId,
  sessionRepository,
  rateLimiter,
  getRoomStats,
  requireDebugKey,
}) {
  const app = express();
  app.use(express.json());

  app.use(
    "/",
    require("./routes/healthRoutes")({
      instanceId,
      sessionRepository,
      rateLimiter,
    })
  );

  app.use(
    "/",
    require("./routes/debugRoutes")({
      getRoomStats,
      requireDebugKey,
    })
  );

  return app;
}

module.exports = createApp;
