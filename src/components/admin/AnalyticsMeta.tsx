import {
  IconDevice,
  IconMonitor,
  IconSmartphone,
  IconTablet,
} from "@/components/admin/icons";

const countryNames = new Intl.DisplayNames(["es"], { type: "region" });

export function countryFlag(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.length !== 2 || c === "—" || c === "OTHERS") return "🌍";
  return String.fromCodePoint(
    ...[...c].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)),
  );
}

export function countryLabel(code: string): string {
  const c = code.trim().toUpperCase();
  if (!c || c === "—" || c === "OTHERS") return "Otros";
  try {
    return countryNames.of(c) ?? code;
  } catch {
    return code;
  }
}

export function DeviceIcon({
  device,
  className = "h-4 w-4 shrink-0 text-zinc-400",
}: {
  device: string;
  className?: string;
}) {
  switch (device.toLowerCase()) {
    case "mobile":
      return <IconSmartphone className={className} />;
    case "desktop":
      return <IconMonitor className={className} />;
    case "tablet":
      return <IconTablet className={className} />;
    default:
      return <IconDevice className={className} />;
  }
}
