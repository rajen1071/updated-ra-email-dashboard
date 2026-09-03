export function cleanEmailTitle(rawName) {
  if (!rawName) return "";
  const parts = rawName.split("|").map((p) => p.trim());
  return parts[parts.length - 1] || rawName;
}
