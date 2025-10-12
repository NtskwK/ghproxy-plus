import { Hono } from "hono";
import { downloadApi } from "./download";
import { ghproxy as ghproxyApi } from "./ghproxy";
import { ping as pingApi } from "./ping";

const apiRouter = new Hono();

apiRouter.get("/ping", pingApi);
apiRouter.get("/download/*", downloadApi);
apiRouter.get("/ghproxy/*", ghproxyApi);

export default apiRouter;
