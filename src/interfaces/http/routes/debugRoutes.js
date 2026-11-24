const express = require("express");

function createDebugRoutes({ getRoomStats, requireDebugKey }) {
  const router = express.Router();

  router.get("/follow/:room", requireDebugKey, async (req, res) => {
    res.json({
      room: req.params.room,
      followers: await getRoomStats.getFollowersInRoom(req.params.room),
    });
  });

  router.get("/screen/:room", requireDebugKey, async (req, res) => {
    res.json({
      room: req.params.room,
      screens: await getRoomStats.getScreensInRoom(req.params.room),
    });
  });

  return router;
}

module.exports = createDebugRoutes;
