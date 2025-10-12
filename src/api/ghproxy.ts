// https://github.com/hunshcn/gh-proxy

import type { Context, HonoRequest } from "hono";

// MIT License
// Copyright (c) 2020 hunshcn
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 前缀，如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！
const GHPROXY_PATH = "/ghproxy/";

// 分支文件使用jsDelivr镜像的开关，0为关闭，默认关闭
const Config = {
    jsdelivr: 0,
};

const whiteList = [] as string[]; // 白名单，路径里面有包含字符的才会通过，e.g. ['/username/']

const PREFLIGHT_INIT = {
    status: 204,
    headers: new Headers({
        "access-control-allow-origin": "*",
        "access-control-allow-methods":
            "GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS",
        "access-control-max-age": "1728000",
    }),
} as ResponseInit;

const exp1 =
    /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i;
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i;
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i;
const exp4 =
    /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i;
const exp5 =
    /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i;
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i;

function checkUrl(url: string): boolean {
    const combinedExp = new RegExp(
        `^(${exp1.source}|${exp2.source}|${exp3.source}|${exp4.source}|${exp5.source}|${exp6.source})`,
    );
    return combinedExp.test(url);
}

export async function ghproxy(c: Context) {
    const urlStr = c.req.url;
    const urlObj = new URL(urlStr);
    let path = urlObj.searchParams.get("q");
    if (path) {
        return Response.redirect(
            `https://${urlObj.host}${GHPROXY_PATH}${path}`,
            301,
        );
    }
    // cfworker 会把路径中的 `//` 合并成 `/`
    path = urlObj.href
        .slice(urlObj.origin.length + GHPROXY_PATH.length)
        .replace(/^https?:\/+/, "https://");

    const combinedExp = new RegExp(
        `^(${exp1.source}|${exp3.source}|${exp5.source}|${exp6.source})`,
    );

    if (combinedExp.test(path)) {
        return httpHandler(c.req, path);
    } else if (exp2.test(path)) {
        if (Config.jsdelivr) {
            const newUrl = path
                .replace("/blob/", "@")
                .replace(
                    /^(?:https?:\/\/)?github\.com/,
                    "https://cdn.jsdelivr.net/gh",
                );
            return Response.redirect(newUrl, 302);
        } else {
            path = path.replace("/blob/", "/raw/");
            return httpHandler(c.req, path);
        }
    } else if (exp4.test(path)) {
        if (Config.jsdelivr) {
            const newUrl = path
                .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, "@$1")
                .replace(
                    /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/,
                    "https://cdn.jsdelivr.net/gh",
                );
            return Response.redirect(newUrl, 302);
        } else {
            return httpHandler(c.req, path);
        }
    } else {
        return c.json({ error: "bad url" }, { status: 400 });
    }
}

function httpHandler(req: HonoRequest, pathname: string) {
    // preflight
    if (
        req.method === "OPTIONS" &&
        req.header("access-control-request-method") !== undefined
    ) {
        return new Response(null, PREFLIGHT_INIT);
    }

    if (whiteList.length) {
        const isAllowed = whiteList.some((item) => pathname.includes(item));
        if (!isAllowed) {
            return new Response("blocked", { status: 403 });
        }
    }

    const HTTP_REGEX = /^https?:\/\//;

    let urlStr = pathname;
    if (!HTTP_REGEX.test(urlStr)) {
        urlStr = `https://${urlStr}`;
    }

    try {
        const urlObj = new URL(urlStr);

        // 根据Content-Type获取请求体
        let body: Promise<string> | null = null;
        if (req.header("content-type")) {
            body = req.text();
        }

        const reqInit = {
            method: req.method,
            headers: req.header(),
            redirect: "manual",
            body: body,
        } as RequestInit;

        return proxy(urlObj, reqInit);
    } catch {
        return new Response("bad url", { status: 400 });
    }
}

async function proxy(urlObj: URL, reqInit: RequestInit) {
    let res: Response;
    try {
        res = await fetch(urlObj.href, reqInit);
    } catch (err) {
        return new Response(`fetch error: ${err}, url: ${urlObj.href}`, {
            status: 500,
        });
    }
    const resHdrOld = res.headers;
    const resHdrNew = new Headers(resHdrOld);

    const status = res.status;

    if (resHdrNew.has("location")) {
        const _location = resHdrNew.get("location");
        if (_location) {
            if (checkUrl(_location))
                resHdrNew.set("location", GHPROXY_PATH + _location);
            else {
                const u = new URL(_location);
                if (u) {
                    reqInit.redirect = "follow";
                    return proxy(u, reqInit);
                }
            }
        }
    }
    resHdrNew.set("access-control-expose-headers", "*");
    resHdrNew.set("access-control-allow-origin", "*");

    resHdrNew.delete("content-security-policy");
    resHdrNew.delete("content-security-policy-report-only");
    resHdrNew.delete("clear-site-data");

    return new Response(res.body, {
        status,
        headers: resHdrNew,
    });
}
