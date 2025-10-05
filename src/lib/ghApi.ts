import { GhRelease, GhTag } from "./ghResponse";
import { LRUCache } from "next/dist/server/lib/lru-cache";
import { isServer } from "./utils";

interface ReleasesCache {
  releases: GhRelease[];
  timestamp: number;
}

interface GhApiError extends Error {
  status: number;
  response: Response;
  data: Record<string, unknown>;
}

const cache = new LRUCache(10);

const getRepoTags = async (owner: string, repo: string): Promise<GhTag[]> => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags`
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const error = new Error(`Network response was not ok: ${response.status}`) as GhApiError;
    error.status = response.status;
    error.response = response;
    error.data = errorData;
    throw error;
  }

  const data = (await response.json()) as GhTag[];
  return data;
};

const getRepoReleases = async (
  owner: string,
  repo: string
): Promise<GhRelease[]> => {
  if (isServer) {
    const cached = cache.get(`${owner}/${repo}`) as ReleasesCache | undefined;
    if (cached) {
      // 1 miniute cache
      if (Date.now() - cached.timestamp < 1000 * 60) {
        return cached.releases;
      }
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const error = new Error(`Network response was not ok: ${response.status}`) as GhApiError;
    error.status = response.status;
    error.response = response;
    error.data = errorData;
    throw error;
  }

  const data = (await response.json()) as GhRelease[];
  if (isServer) {
    cache.set(`${owner}/${repo}`, {
      releases: data,
      timestamp: Date.now(),
    });
  }
  return data;
};

const getLatestRelease = async (
  owner: string,
  repo: string
): Promise<GhRelease | null> => {
  const releases = await getRepoReleases(owner, repo);
  return releases[0] || null;
};

export { getRepoTags, getRepoReleases, getLatestRelease };
