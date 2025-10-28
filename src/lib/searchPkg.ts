import type { GhReleaseAssets } from "./ghResponse";
import { type CPUArchitecture, getOSandArch } from "./utils";

/**
 * Check if an asset filename is a hash/checksum file or signature file.
 * These files should be excluded from auto-selection.
 * @param filename - The asset filename to check
 * @returns true if the file is a hash/checksum/signature file
 */
const isHashFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  const hashExtensions = [
    ".md5",
    ".md5sum",
    ".sha1",
    ".sha1sum",
    ".sha256",
    ".sha256sum",
    ".sha512",
    ".sha512sum",
    ".asc",
    ".sig"
  ];
  return hashExtensions.some((ext) => lowerName.endsWith(ext));
};

/**
 * Filter out hash/checksum files from the assets list.
 * @param assets - The list of assets to filter
 * @returns Filtered list of assets without hash files
 */
const filterHashFiles = (assets: GhReleaseAssets[]): GhReleaseAssets[] => {
  const filtered = assets.filter((asset) => !isHashFile(asset.name));
  // Return filtered list if it's not empty, otherwise return original list
  // to avoid returning undefined when only hash files exist
  return filtered.length > 0 ? filtered : assets;
};

const searchAsset = (
  keywords: string[],
  assets: GhReleaseAssets[]
): GhReleaseAssets | undefined => {
  if (!keywords?.length || !assets?.length) {
    return undefined;
  }

  // Filter out hash files before searching
  const filteredAssets = filterHashFiles(assets);

  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  // select assets that match all keywords
  const fullMatches = filteredAssets.filter((asset) => {
    const lowerName = asset.name.toLowerCase();
    return lowerKeywords.every((keyword) => lowerName.includes(keyword));
  });

  if (fullMatches.length > 0) {
    return fullMatches[0];
  }

  // If no full matches, find the asset with the most keyword matches
  let bestMatch: GhReleaseAssets | undefined;
  let maxMatches = 0;

  filteredAssets.forEach((asset) => {
    const lowerName = asset.name.toLowerCase();
    const matchCount = lowerKeywords.filter((keyword) =>
      lowerName.includes(keyword)
    ).length;

    // Prefer assets that match more keywords
    // Choose at least one asset if there are no full matches
    if (matchCount >= maxMatches) {
      maxMatches = matchCount;
      bestMatch = asset;
    }
  });
  return bestMatch;
};

/**
 * Get the keywords for searching assets based on the OS and architecture.
 *
 * os: https://docs.uaparser.dev/info/os/name.html
 *
 * arch: https://docs.uaparser.dev/info/cpu/arch.html
 * @param os - operating system
 * @param arch - CPU architecture
 * @returns keywords array
 */
const getKeywords = (
  osName: string | undefined,
  arch: CPUArchitecture
): string[] => {
  const keywords: string[] = [];
  // Add architecture keywords
  if (arch) {
    keywords.push(arch.toLowerCase());
    if (arch.toLowerCase() === "amd64") {
      keywords.push("x64", "x86_64");
    } else if (arch.toLowerCase() === "ia32") {
      keywords.push("i386", "x86");
    } else if (arch.toLowerCase() === "arm64") {
      keywords.push("aarch64", "armv8", "armv8l");
    } else if (arch.toLowerCase() === "arm") {
      keywords.push("armv7", "armv7l", "armhf");
    }
  }

  // Add OS keywords
  if (osName) {
    if (osName.toLowerCase() === "android") {
      keywords.push("android", "armv8", "universal", "apk");
    } else if (osName.toLowerCase() === "windows") {
      keywords.push("windows", "win32", "win64", "win", "exe", "msi", "zip");
    } else if (osName.toLowerCase() === "ios") {
      keywords.push("ios", "ipa");
    } else if (osName.toLowerCase() === "macos") {
      keywords.push("macos", "darwin", "dmg", "aarch64");
    } else {
      // Linux and others
      if (
        osName.toLowerCase() === "debian" ||
        osName.toLowerCase() === "ubuntu" ||
        osName.toLowerCase() === "mint" ||
        osName.toLowerCase() === "deepin"
      ) {
        keywords.push("debian", "deb", "ubuntu", "mint");
      } else if (
        osName.toLowerCase() === "centos" ||
        osName.toLowerCase() === "redhat"
      ) {
        keywords.push("centos", "el", "rhel", "rpm");
      } else if (osName.toLowerCase() === "arch") {
        keywords.push("archlinux");
      } else if (osName.toLowerCase() === "freebsd") {
        keywords.push("freebsd");
      } else if (osName.toLowerCase() === "harmonyos") {
        keywords.push("hap");
      }
      // Any else?

      // others
      keywords.push("gnu", "linux", "unknown", "flatpak", "appimage", "pkg");
    }
  }
  return keywords;
};

export const getDownloadAsset = (
  assets: GhReleaseAssets[],
  ua: string | undefined,
  keyword: string | undefined
): GhReleaseAssets | undefined => {
  if (assets.length === 0) {
    return undefined;
  }

  // Filter out hash files from all assets
  const filteredAssets = filterHashFiles(assets);

  if (filteredAssets.length <= 2 && ua === undefined && keyword === undefined) {
    const tarAsset = searchAsset(["tar.gz"], filteredAssets);
    if (tarAsset) {
      return tarAsset;
    } else {
      return filteredAssets[0];
    }
  }

  if (keyword) {
    const asset = searchAsset([keyword], filteredAssets);
    if (asset) {
      return asset;
    } else {
      // If the keyword search fails, fall back to UA parsing
    }
  }

  if (!ua) {
    return filteredAssets[0];
  }

  const { os, arch } = getOSandArch(ua);
  const keywords = getKeywords(os, arch);
  let result = searchAsset(keywords, filteredAssets);
  if (!result) {
    const compressKeywords = ["tar.gz", "zip", "tar.zst"];
    result = searchAsset(compressKeywords, filteredAssets);
  }

  return result;
};
