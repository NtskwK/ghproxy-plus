import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
