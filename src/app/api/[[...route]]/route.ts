import { NextResponse } from "next/server";

export function GET(request: Request) {
  const path = new URL(request.url);
  const datetime = new Date().toISOString();
  return NextResponse.json(
    { message: "Not Found.", path: path.pathname, datetime },
    { status: 404 }
  );
}
