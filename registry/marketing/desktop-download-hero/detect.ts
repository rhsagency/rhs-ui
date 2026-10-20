export type DesktopOs = "macos" | "windows" | "linux";
export type DesktopCpu = "arm64" | "x64";

export interface DesktopPlatform {
  /** A unique id such as "macos-arm64". It is what the `detect` prop accepts. */
  id: string;
  /** The system: "macOS", "Windows", "Linux". */
  label: string;
  /** The processor or package, shown in brackets after the label: "Apple silicon", "Intel", "x64", ".deb". */
  arch?: string;
  /** The file to download. Its extension names the file type for screen readers. */
  href: string;
  /** The download size as written: "118 MB". */
  size?: string;
  /** Which system the file is for. Read from the id and label when left out. */
  os?: DesktopOs;
  /** Which processor the file is for. Read from the id and arch when left out. */
  cpu?: DesktopCpu;
}

export interface DetectionInput {
  /** navigator.userAgent. */
  userAgent: string;
  /** navigator.userAgentData.platform where it exists, else navigator.platform. */
  platform?: string;
  /** navigator.maxTouchPoints: an iPad that reports itself as a Mac has several. */
  touchPoints?: number;
  /** The processor, when the browser is willing to say (Chromium's high-entropy hints). */
  cpu?: DesktopCpu;
}

/** The system a platform entry is for, from its own fields. */
export function osOf(platform: DesktopPlatform): DesktopOs | undefined {
  if (platform.os) return platform.os;
  const text = `${platform.id} ${platform.label}`.toLowerCase();
  if (/mac|darwin|osx/.test(text)) return "macos";
  if (/win/.test(text)) return "windows";
  if (/linux|ubuntu|debian|fedora|appimage/.test(text)) return "linux";
  return undefined;
}

/** The processor a platform entry is for, from its own fields. */
export function cpuOf(platform: DesktopPlatform): DesktopCpu | undefined {
  if (platform.cpu) return platform.cpu;
  const text = `${platform.id} ${platform.arch ?? ""}`.toLowerCase();
  if (/arm|aarch|apple|silicon/.test(text)) return "arm64";
  if (/x64|x86|amd64|intel/.test(text)) return "x64";
  return undefined;
}

/** ".dmg", ".exe", ".AppImage", ".tar.gz": the file type in a download link, if it has one. */
export function fileTypeOf(href: string): string | undefined {
  const path = href.split(/[?#]/)[0] ?? "";
  const match = /\.(tar\.[a-z0-9]+|[a-z0-9]{2,8})$/i.exec(path);
  return match ? `.${match[1]}` : undefined;
}

/** "macOS (Apple silicon)": how a platform is named on its button. */
export function platformName(platform: DesktopPlatform): string {
  return platform.arch ? `${platform.label} (${platform.arch})` : platform.label;
}

/** The system a browser runs on, or undefined for phones, tablets, Chromebooks and anything it does not recognise. */
export function systemOf({ userAgent, platform = "", touchPoints = 0 }: DetectionInput): DesktopOs | undefined {
  if (/android|iphone|ipad|ipod|cros|tablet/i.test(userAgent)) return undefined;
  const hint = platform.toLowerCase();
  // iPadOS reports itself as a Mac; a Mac has no touch screen.
  if (/mac/.test(hint) || /macintosh|mac os x/i.test(userAgent)) return touchPoints > 1 ? undefined : "macos";
  if (/win/.test(hint) || /windows/i.test(userAgent)) return "windows";
  if (/linux|x11/.test(hint) || /linux|x11/i.test(userAgent)) return "linux";
  return undefined;
}

/**
 * Picks the platform for this browser: the one for its system and, when the
 * browser says which processor it has, for that processor too; otherwise the
 * first one listed for the system. Undefined when nothing fits, so the caller
 * keeps showing every platform.
 */
export function detectPlatform(platforms: readonly DesktopPlatform[], input: DetectionInput): string | undefined {
  const system = systemOf(input);
  if (!system) return undefined;
  const ofSystem = platforms.filter((platform) => osOf(platform) === system);
  const exact = input.cpu ? ofSystem.find((platform) => cpuOf(platform) === input.cpu) : undefined;
  return (exact ?? ofSystem[0])?.id;
}
