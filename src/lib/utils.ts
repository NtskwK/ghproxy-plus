import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { IOS, UAParser } from "ua-parser-js";
import { CPUArch } from "ua-parser-js/enums";

export const isClient = typeof window !== "undefined";
export const isServer = !isClient;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GhRepo {
  owner: string;
  repo: string;
}

export function extractRepoFromURL(url: string): GhRepo | null {
  const match = url.match(/(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/?#]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    };
  }
  return null;
}

/**
 * Get the operating system and architecture from a user agent string.
 * @param ua - user agent string
 * @returns os and architecture
 * os: https://docs.uaparser.dev/info/os/name.html
 * arch: https://docs.uaparser.dev/info/cpu/arch.html
 */
export function getOSandArch(ua: string): {
  os: string | undefined;
  arch: CPUArchitecture;
} {
  const parser = new UAParser(ua);
  const os = parser.getOS().name;
  const arch = parser.getCPU().architecture as CPUArchitecture | undefined;
  return { os, arch };
}

export type CPUArchitecture =
  | (typeof CPUArch)[keyof typeof CPUArch]
  | undefined;
