import { getRepoReleases } from "@/lib/ghApi";
import { getDownloadAsset } from "@/lib/searchPkg";
import { extractRepoFromURL } from "@/lib/utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GHPROXY_PATH } from "@/lib/utils";

const PREFIX = "/api/download/";

export async function GET(request: Request) {
  const ua = (await headers()).get("user-agent") || "";
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
    return NextResponse.redirect(new URL("/api/404", urlObj.origin), 302);
  }

  const repo = extractRepoFromURL(path);
  if (!repo) {
    return NextResponse.redirect(new URL("/api/404", urlObj.origin), 302);
  }

  let releases;
  try {
    releases = await getRepoReleases(repo.owner, repo.repo);
  } catch (err) {
    return NextResponse.json(
      {
        error: "fetch error: " + err,
        status: 500,
        requestUrl: `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases`,
      },
      { status: 500 }
    );
  }

  if (!releases || releases.length === 0) {
    return NextResponse.redirect(new URL("/api/404", urlObj.origin), 302);
  }

  const asset = getDownloadAsset(releases[0].assets, ua, keyword);
  if (!asset) {
    return NextResponse.redirect(new URL("/api/404", urlObj.origin), 302);
  }

  const downloadUrl = urlObj.origin + GHPROXY_PATH + asset.browser_download_url;
  return Response.redirect(downloadUrl, 302);
}
