import { getRepoReleases } from "@/lib/ghApi";
import { getDownloadAsset } from "@/lib/searchPkg";
import { extractRepoFromURL, getOSandArch } from "@/lib/utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GHPROXY_PATH } from "@/lib/utils";

const PREFIX = "/download/";

export async function GET(request: Request) {
  const headersObj = await headers();
  const ua = headersObj.get("user-agent") || "";
  const urlObj = new URL(request.url);
  const keyword = urlObj.searchParams.get("keyword") || "";

  let path = urlObj.searchParams.get("q");
  if (path) {
    return Response.redirect("https://" + urlObj.host + PREFIX + path, 301);
  }

  // the `//` in path will be merged to `/` by cfworker
  path = urlObj.href
    .slice(urlObj.origin.length + PREFIX.length)
    .replace(/^https?:\/+/, "https://");
  if (!path || path.trim() === "") {
    const message = "Invalid URL.";
    return NextResponse.redirect(
      new URL("/api/404?message=" + encodeURIComponent(message), urlObj.origin),
      302
    );
  }

  const repo = extractRepoFromURL(path);
  if (!repo) {
    const message = "Repo not found.";
    return NextResponse.redirect(
      new URL("/api/404?message=" + encodeURIComponent(message), urlObj.origin),
      302
    );
  }

  const reqInit = {
    method: request.method,
    headers: new Headers(request.headers),
    redirect: "manual",
    body: request.body,
  } as RequestInit;

  let releases;
  try {
    releases = await getRepoReleases(repo.owner, repo.repo, reqInit);
  } catch (err) {
    const { os, arch } = getOSandArch(ua);

    const { url, status } = err as { url?: string; status?: number };

    return NextResponse.json(
      {
        os,
        arch,
        headersObj,
        error: err,
        requestUrl: url || null,
      },
      { status: status || 500 }
    );
  }

  if (!releases || releases.length === 0) {
    const message = "No releases found.";
    return NextResponse.redirect(
      new URL("/api/404?message=" + encodeURIComponent(message), urlObj.origin),
      302
    );
  }

  const asset = getDownloadAsset(releases[0].assets, ua, keyword);
  if (!asset) {
    const message = "No asset found in release.";
    return NextResponse.redirect(
      new URL("/api/404?message=" + encodeURIComponent(message), urlObj.origin),
      302
    );
  }

  const downloadUrl = urlObj.origin + GHPROXY_PATH + asset.browser_download_url;
  return Response.redirect(downloadUrl, 302);
}
