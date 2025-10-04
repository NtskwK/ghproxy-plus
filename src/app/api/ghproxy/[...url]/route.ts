// https://github.com/hunshcn/gh-proxy

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

import { NextResponse } from "next/server";
import { log } from "node:console";

// 前缀，如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！
const PREFIX = "/api/ghproxy/";
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

function newUrl(urlStr: string) {
  try {
    return new URL(urlStr);
  } catch (err) {
    throw err;
  }
}

function checkUrl(u: string) {
  for (const i of [exp1, exp2, exp3, exp4, exp5, exp6]) {
    if (u.search(i) === 0) {
      return true;
    }
  }
  return false;
}

export async function GET(request: Request) {
  const urlStr = request.url;
  const urlObj = new URL(urlStr);
  let path = urlObj.searchParams.get("q");
  if (path) {
    return Response.redirect("https://" + urlObj.host + PREFIX + path, 301);
  }
  // cfworker 会把路径中的 `//` 合并成 `/`
  path = urlObj.href
    .slice(urlObj.origin.length + PREFIX.length)
    .replace(/^https?:\/+/, "https://");

  log("request url:", request.url);
  log("urlObj.href:", urlObj.href);
  log("urlObj.origin:", urlObj.origin);
  log("urlObj.hostname:", urlObj.hostname);
  log("urlObj.pathname:", urlObj.pathname);
  log("new url:", path);
  if (
    path.search(exp1) === 0 ||
    path.search(exp3) === 0 ||
    path.search(exp4) === 0 ||
    path.search(exp5) === 0 ||
    path.search(exp6) === 0
  ) {
    return httpHandler(request, path);
  } else if (path.search(exp2) === 0) {
    if (Config.jsdelivr) {
      const newUrl = path
        .replace("/blob/", "@")
        .replace(/^(?:https?:\/\/)?github\.com/, "https://cdn.jsdelivr.net/gh");
      return Response.redirect(newUrl, 302);
    } else {
      path = path.replace("/blob/", "/raw/");
      return httpHandler(request, path);
    }
  } else if (path.search(exp4) === 0) {
    const newUrl = path
      .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, "@$1")
      .replace(
        /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/,
        "https://cdn.jsdelivr.net/gh"
      );
    return Response.redirect(newUrl, 302);
  } else {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
}

function httpHandler(req: Request, pathname: string) {
  const reqHdrRaw = req.headers;

  // preflight
  if (
    req.method === "OPTIONS" &&
    reqHdrRaw.has("access-control-request-headers")
  ) {
    return new Response(null, PREFLIGHT_INIT);
  }

  const reqHdrNew = new Headers(reqHdrRaw);

  let urlStr = pathname;
  let flag = !Boolean(whiteList.length);
  for (const i of whiteList) {
    if (urlStr.includes(i)) {
      flag = true;
      break;
    }
  }
  if (!flag) {
    return new Response("blocked", { status: 403 });
  }
  if (urlStr.search(/^https?:\/\//) !== 0) {
    urlStr = "https://" + urlStr;
  }
  const urlObj = newUrl(urlStr);
  if (!urlObj) {
    return new Response("bad url", { status: 400 });
  }

  const reqInit = {
    method: req.method,
    headers: reqHdrNew,
    redirect: "manual",
    body: req.body,
  } as RequestInit;
  return proxy(urlObj, reqInit);
}

async function proxy(urlObj: URL, reqInit: RequestInit) {
  let res;
  try {
    res = await fetch(urlObj.href, reqInit);
  } catch (err) {
    return new Response("fetch error: " + err, { status: 500 });
  }
  const resHdrOld = res.headers;
  const resHdrNew = new Headers(resHdrOld);

  const status = res.status;

  if (resHdrNew.has("location")) {
    const _location = resHdrNew.get("location");
    if (_location) {
      if (checkUrl(_location)) resHdrNew.set("location", PREFIX + _location);
      else {
        const u = newUrl(_location);
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
