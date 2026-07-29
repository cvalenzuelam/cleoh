/** Quita \\r\\n literales y saltos reales en valores de .env */
export function cleanEnvValue(raw) {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\r\\n|\\n|\\r/g, "")
    .replace(/[\r\n\t]+/g, "")
    .trim();
}
