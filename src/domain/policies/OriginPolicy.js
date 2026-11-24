const DEFAULT_ORIGINS = [
  "https://www.auctav.com",
  "https://auctav.com",
  "https://socket-auctav.astucom.com",
];

const DEV_ORIGINS = ["http://localhost", "http://127.0.0.1"];

class OriginPolicy {
  constructor(allowedOrigins = DEFAULT_ORIGINS) {
    this.allowedOrigins = allowedOrigins;
  }

  static fromEnv(env = process.env) {
    const raw = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",")
      : DEFAULT_ORIGINS;

    const origins = raw
      .map((o) => o.trim())
      .filter((o) => o && o !== "*");

    if (env.ALLOW_DEV_ORIGINS === "true") {
      origins.push(...DEV_ORIGINS);
    }

    return new OriginPolicy(origins);
  }

  isAllowed(origin) {
    return typeof origin === "string" && this.allowedOrigins.includes(origin);
  }

  getList() {
    return [...this.allowedOrigins];
  }
}

module.exports = { OriginPolicy, DEFAULT_ORIGINS, DEV_ORIGINS };
