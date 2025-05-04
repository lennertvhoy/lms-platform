# Development Log

This file records each key issue encountered, user query, and corresponding change or guidance provided during the development of the AI-Integrated LMS Platform.

---

## 2025-05-04

### 1. Remote Container Launch Failure
**User Query:** Remote container reopening did not work; only opened a couple of files for editing.
**Action:** Updated `.devcontainer/devcontainer.json` to change:
```json
-  "dockerComposeFile": "docker-compose.yml",
+  "dockerComposeFile": ["../docker-compose.yml"],
```
This fixed VS Code's ability to locate the root `docker-compose.yml`.

### 2. Next.js Frontend `NetworkError` Fetching API
**User Query:** Next.js homepage shows `Error: NetworkError when attempting to fetch resource.`
**Guidance:**
- Verified Azure Functions host must be running on port 7071 (`func start`).
- Recommended either:
  - Creating `apps/portal/.env.local` with:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:7071/api
    ```
  - Or using a relative fetch path (`fetch('/api/hello')`) coupled with the `rewrites` rule in `next.config.js` to proxy `/api` to Functions.

### 3. Wrong Container Context for `npm`
**User Query:** Running `npm run start` inside `mssql` container returned `npm: command not found`.
**Explanation:** The SQL Edge container (`mssql`) lacks Node/npm. The Node image is under the `app` service. 
**Guidance:** Use:
```bash
docker-compose exec app bash
```
to enter the Node container where `npm` is available.

### 4. Missing `package.json` in Container Shell
**User Query:** In `app` container shell, `npm --workspace` commands fail because `$PWD` was `/home/node`.
**Action:** Added `working_dir: /workspace` to `app` service in `docker-compose.yml`:
```yaml
services:
  app:
    image: ...
    working_dir: /workspace
    volumes:
      - .:/workspace:cached
```
This ensures new shells start in `/workspace` (repo root).

### 5. Command to Apply Working Dir Fix
**Guidance:** Recommended either `cd /workspace` manually, or recreate the container:
```bash
docker-compose down
docker-compose up -d --force-recreate app
``` 
so `working_dir` takes effect.

### 6. Azure Functions Core Tools Not Installed
**User Query:** `npm --workspace=api/functions run start` fails with `func: not found`.
**Action:** Modified `.devcontainer/devcontainer.json` `postCreateCommand` to install Core Tools v4 globally:
```diff
- "postCreateCommand": "npm install --workspace=packages/db && npm install --workspace=apps/portal && npm install --workspace=api/functions"
+ "postCreateCommand": "npm install --workspace=packages/db && npm install --workspace=apps/portal && npm install --workspace=api/functions && npm install -g azure-functions-core-tools@4 --unsafe-perm true"
```
Then ran **Remote-Containers: Rebuild Container**.

---

*End of development log.* 