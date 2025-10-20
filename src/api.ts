import { Hono } from "hono";
import apiRouter from "./api/route";

const app = new Hono();

app.route("/api", apiRouter);

export default app;
