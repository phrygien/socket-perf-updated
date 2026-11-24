function getClientIp(headers, address) {
  const forwarded = headers?.["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return address || "unknown";
}

module.exports = getClientIp;
