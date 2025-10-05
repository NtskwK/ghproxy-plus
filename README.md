# GHProxy Plus

A GitHub proxy service that accelerates access to GitHub resources and provides smart download functionality for release assets.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API Manual

### 1. GitHub Proxy API

**Endpoint:** `/api/ghproxy/{github-url}`

Proxies GitHub resources with CORS headers, allowing accelerated access to GitHub files, releases, and repositories.

**Supported URL Types:**
- GitHub releases and archives: `github.com/{owner}/{repo}/releases/*`
- GitHub raw files: `github.com/{owner}/{repo}/blob/*` or `github.com/{owner}/{repo}/raw/*`
- GitHub raw content: `raw.githubusercontent.com/*` or `raw.github.com/*`
- GitHub gists: `gist.githubusercontent.com/*` or `gist.github.com/*`
- GitHub repository info: `github.com/{owner}/{repo}/info/*` or `github.com/{owner}/{repo}/git-*`
- GitHub tags: `github.com/{owner}/{repo}/tags/*`

**Example:**

```bash
curl https://your-domain.com/api/ghproxy/https://github.com/owner/repo/releases/download/v1.0.0/file.zip
```

**Response:**
- Success: Proxied content with CORS headers
- Error 400: Invalid or unsupported URL
- Error 403: URL blocked by whitelist (if configured)
- Error 500: Fetch error

---

### 2. Smart Download API

**Endpoint:** `/api/download/{github-repo-url}`

Automatically detects the user's operating system and architecture from the User-Agent header and downloads the most appropriate release asset from the latest release.

**Parameters:**
- `keyword` (optional): Additional keyword to filter assets

**Example:**

```bash
curl -L https://your-domain.com/api/download/https://github.com/owner/repo
```

**Detection Logic:**
- Parses User-Agent to determine OS (Windows, macOS, Linux, Android, iOS, etc.)
- Detects CPU architecture (x86_64, arm64, etc.)
- Automatically selects the best matching asset from the latest release
- Falls back to first asset if no match found

**Response:**
- Success (302): Redirects to the download URL via `/api/ghproxy/`
- Error (302): Redirects to 404 page if repo not found or no suitable asset

---

### 3. Health Check API

**Endpoint:** `/api/ping`

Health check endpoint that returns server status information.

**Example:**

```bash
curl https://your-domain.com/api/ping
```

**Response:**

```json
{
  "message": "pong",
  "uptime": 12345.67,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pid": 1234
}
```

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
