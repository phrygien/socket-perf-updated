/**
 * Port de limitation du nombre de connexions par IP.
 */
class RateLimiter {
  acquire(_ip) { throw new Error("Not implemented"); }
  release(_ip) { throw new Error("Not implemented"); }
  activeIpCount() { throw new Error("Not implemented"); }
  cleanup() { throw new Error("Not implemented"); }
  stop() { throw new Error("Not implemented"); }
}

module.exports = RateLimiter;
