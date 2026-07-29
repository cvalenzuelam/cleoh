/** Quita \\r\\n literales y saltos reales que a veces vienen en .env */
export function cleanEnv(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\r\\n|\\n|\\r/g, "")
    .replace(/[\r\n\t]+/g, "")
    .trim();
}

export function requireEnv(name: string): string {
  const value = cleanEnv(process.env[name]);
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}
