import { getOSandArch } from "@/lib/utils";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const urlObgj = new URL(request.url);
  const path = urlObgj.pathname;
  const message = urlObgj.searchParams.get("message") || "Not Found.";
  const datetime = new Date().toISOString();
  const ua = request.headers.get("user-agent") || "";
  const { os, arch } = getOSandArch(ua);
  return NextResponse.json(
    { message, path, os, arch, datetime },
    { status: 404 }
  );
}
