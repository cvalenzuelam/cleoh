import fs from "fs";

const file = process.argv[2] || ".env.regression";
const line = fs
  .readFileSync(file, "utf8")
  .split(/\r?\n/)
  .find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));

if (!line) {
  console.log("line not found");
  process.exit(1);
}

const value = line.slice(line.indexOf("=") + 1);
console.log("raw value repr:", JSON.stringify(value));
console.log(
  "char codes at end:",
  [...value.slice(-6)].map((c) => c.charCodeAt(0)),
);
