const { OriginPolicy } = require("../../domain/policies/OriginPolicy");

function loadConfig(env = process.env) {
  const originPolicy = OriginPolicy.fromEnv(env);

  return {
    PORT: Number(env.PORT) || 3000,
    INSTANCE_ID: env.INSTANCE_ID || "unknown",
    ALLOWED_ORIGINS: originPolicy.getList(),
    originPolicy,
    ADMIN_KEY: env.ADMIN_KEY || "",
    DEBUG_KEY: env.DEBUG_KEY || "",
    REDIS_URL: env.REDIS_URL || "",
  };
}

module.exports = { loadConfig };
