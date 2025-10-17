#

## _1. gh-proxy API_

**Endpoint:** `/ghproxy/{github-url}`

Proxies GitHub resources with CORS headers, allowing accelerated access to GitHub files, releases, and repositories.

---

## _2. Smart Download API_

**Endpoint:** `/api/download/{github-repo-url}`

Automatically detects the user's operating system and architecture from the User-Agent header and downloads the most appropriate release asset from the latest release.

**Parameters:**

- `keyword` (optional): Additional keyword to filter assets

**Example:**

~~curl -L https://[host]/api/download/github.com/owner/repo~~

Don't fetch it! You can only access it through the browser.

**Detection Logic:**

- Parses User-Agent to determine OS (Windows, macOS, Linux, Android, iOS, etc.)
- Detects CPU architecture (x86_64, arm64, etc.)
- Automatically selects the best matching asset from the latest release
- Falls back to first asset if no match found

---

### _3. Health Check API_

**Endpoint:** `/api/ping`

Health check endpoint that returns server status information.

**Example:**

```bash
curl https://[host]/api/ping
```
