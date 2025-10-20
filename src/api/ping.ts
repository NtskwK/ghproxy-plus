import type { Context } from "hono";

export async function ping(c: Context) {
  const uptime =
    typeof process !== "undefined" && typeof process.uptime === "function"
      ? process.uptime()
      : null;
  const timestamp = new Date().toISOString();

  const payload = {
    message: "pong",
    uptime,
    timestamp,
    pid: typeof process !== "undefined" ? process.pid : null
  };

  return c.json(payload, { status: 200 });
}
