import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ message: "Not Found." }, { status: 404 });
}
