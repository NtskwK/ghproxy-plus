import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { getRepoReleases } from "@/lib/ghApi";
import type { GhRelease } from "@/lib/ghResponse";
import { getDownloadAsset } from "@/lib/searchPkg";
import { extractRepoFromURL, GHPROXY_PATH, getOSandArch } from "@/lib/utils";

const PREFIX = "/api/download/";

export async function downloadApi(c: Context) {
  const headerGetter = c.req.header;
  const ua = headerGetter("user-agent") || "";
  const urlObj = new URL(c.req.url);
  const keyword = urlObj.searchParams.get("keyword") || "";

  let path = urlObj.searchParams.get("q");
  if (path) {
    return Response.redirect(`https://${urlObj.host}${PREFIX}${path}`, 301);
  }

  // the `//` in path will be merged to `/` by cfworker
  path = urlObj.href
    .slice(urlObj.origin.length + PREFIX.length)
    .replace(/^https?:\/+/, "https://");
  if (!path || path.trim() === "") {
    const message = "Invalid URL.";
    return c.redirect(
      new URL(`/api/404?message=${encodeURIComponent(message)}`, urlObj.origin),
      302,
    );
  }

  const repo = extractRepoFromURL(path);
  if (!repo) {
    const message = "Repo not found.";
    return c.redirect(
      new URL(`/api/404?message=${encodeURIComponent(message)}`, urlObj.origin),
      302,
    );
  }

  let body: string | null = null;
  if (headerGetter("content-type")) {
    body = await c.req.text();
  }

  const reqInit = {
    method: c.req.method,
    headers: c.req.header(),
    redirect: "manual",
    body: body,
  } as RequestInit;

  let releases: GhRelease[];
  try {
    releases = await getRepoReleases(repo.owner, repo.repo, reqInit);
  } catch (err) {
    const { os, arch } = getOSandArch(ua);

    const { url, status } = err as { url?: string; status?: number };

    return c.json(
      {
        os,
        arch,
        headersObj: headerGetter,
        error: err,
        requestUrl: url || null,
      },
      (status || 500) as ContentfulStatusCode,
    );
  }

  if (!releases || releases.length === 0) {
    const message = "No releases found.";
    return c.redirect(
      new URL(`/api/404?message=${encodeURIComponent(message)}`, urlObj.origin),
      302,
    );
  }

  const asset = getDownloadAsset(releases[0].assets, ua, keyword);
  if (!asset) {
    const message = "No asset found in release.";
    return c.redirect(
      new URL(`/api/404?message=${encodeURIComponent(message)}`, urlObj.origin),
      302,
    );
  }

  const downloadUrl = urlObj.origin + GHPROXY_PATH + asset.browser_download_url;
  return Response.redirect(downloadUrl, 302);
}
