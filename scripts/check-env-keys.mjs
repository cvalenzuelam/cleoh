import fs from "fs";

const file = process.argv[2] || ".env.regression";
const env = Object.fromEntries(
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
          .replace(/[\r\n\t]+/g, "")
          .trim(),
      ];
    }),
);

for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  const value = env[key] || "";
  console.log(`${key}: len=${value.length}`);
}
