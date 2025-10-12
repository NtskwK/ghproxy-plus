import { Hono } from "hono";
import apiRouter from "./api/route";

const app = new Hono();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.route("/api/*", apiRouter);

export default app;
