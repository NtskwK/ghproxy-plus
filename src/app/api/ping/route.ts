import { NextResponse } from "next/server";

export async function GET() {
  const uptime =
    typeof process !== "undefined" && typeof process.uptime === "function"
      ? process.uptime()
      : null;
  const timestamp = new Date().toISOString();

  const payload = {
    message: "pong",
    uptime,
    timestamp,
    pid: typeof process !== "undefined" ? process.pid : null,
  };

  return NextResponse.json(payload, { status: 200 });
}
