import { LRUCache } from "lru-cache";
import type { GhRelease, GhReleaseAssets, GhTag } from "./ghResponse";
import { type ErrorWithUrl, isServer } from "./utils";

interface ReleasesCache {
    releases: GhRelease[];
    timestamp: number;
}

interface GhApiError extends Error {
    status: number;
    response: Response;
    data: Record<string, unknown>;
}

const cache = new LRUCache({ max: 10, ttl: 60 * 1000 });

const getRepoTags = async (owner: string, repo: string): Promise<GhTag[]> => {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/tags`,
    );

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<
            string,
            unknown
        >;
        const error = new Error(
            `Network response was not ok: ${response.status}`,
        ) as GhApiError;
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
    repo: string,
    reqInit: RequestInit = {},
): Promise<GhRelease[]> => {
    // cache for client is handled by browser storage
    if (isServer) {
        const cached = cache.get(`${owner}/${repo}`) as
            | ReleasesCache
            | undefined;
        if (cached) {
            return cached.releases;
        }
    }

    let response: Response;
    try {
        response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/releases`,
            reqInit,
        );
    } catch (e) {
        (e as ErrorWithUrl).url =
            `https://api.github.com/repos/${owner}/${repo}/releases`;
        throw e;
    }

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<
            string,
            unknown
        >;
        let error: GhApiError;
        if (response.status === 403) {
            error = new Error(
                `API rate limit exceeded for GitHub API (status: ${response.status}).\nDon't use a proxy to access the API!`,
            ) as GhApiError;
        } else {
            error = new Error(
                `Network response was not ok: ${response.status}`,
            ) as GhApiError;
        }
        error.status = response.status;
        error.response = response;
        error.data = errorData;
        throw error;
    }

    const data = (await response.json()) as GhRelease[];
    if (isServer) {
        cache.set(`${owner}/${repo}`, {
            releases: data,
        });
    }
    return data;
};

const getSourceCode = (
    owner: string,
    repo: string,
    tag: string,
): GhReleaseAssets[] => {
    // https://github.com/MAA1999/M9A/archive/refs/tags/v3.14.0.zip
    const suffixes = [".tar.gz", ".zip"];
    const assets = suffixes.map((suffix) => ({
        name: `SourceCode-${tag}${suffix}`,
        browser_download_url: `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}${suffix}`,
    })) as GhReleaseAssets[];
    return assets;
};

const getLatestRelease = async (
    owner: string,
    repo: string,
): Promise<GhRelease | null> => {
    const releases = await getRepoReleases(owner, repo);
    return releases[0] || null;
};

export { getRepoTags, getRepoReleases, getLatestRelease, getSourceCode };
