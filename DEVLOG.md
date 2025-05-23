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

## 2025-05-05

### 7. Deploy Bicep Script
**User Query:** can you add a script in `scripts` to deploy the `main.bicep` file  
**Action:** Created `scripts/deploy_bicep.sh` to automate Azure CLI deployment of `infra/main.bicep`, with parameters for resource group, location, and optional parameters file.

## 2025-05-06

### 8. Remove Infra Script
**User Query:** ok and can you now create a script to automatically remove all of these resources  
**Action:** Created `scripts/remove_infra.sh` to delete the resource group and purge the Key Vault for full cleanup.

### 9. Deploy Script & Bicep Fixes
**User Query:** fix Bicep warnings/errors and improve redeploy  
**Action:**
- Updated `scripts/deploy_bicep.sh` to accept SQL admin credentials as parameters and pass them to the Bicep deployment.  
- Removed unused `staticLocation` parameter from `infra/main.bicep`.  
- Fixed SQL Database resource in `infra/main.bicep`: added `location`, moved `sku` out of `properties`.  
- Removed unnecessary `dependsOn` from the `webApp` resource in `infra/main.bicep`.

## 2025-05-07

### 10. Fix Deploy Script Bicep Path
**User Query:** Error running `deploy_bicep.sh` – Bicep file not found.  
**Action:** Updated `scripts/deploy_bicep.sh` to derive the absolute path to `infra/main.bicep` using the script directory, ensuring the file is located correctly when run from the `scripts` folder.

## 2025-05-08

### 11. Bicep Param & Vault Naming
**User Query:** BCP334 warning and Key Vault name conflict on redeploy  
**Action:**
- Added `@minLength(3)` decorator to the `location` parameter in `infra/main.bicep` to satisfy the minimum length constraint.  
- Changed Key Vault resource in `infra/main.bicep` to use `uniqueString(resourceGroup().id)` for its name, avoiding name collisions.  
- Added a `keyVaultName` output in `infra/main.bicep` for cleanup and scripting.

### 12. Deploy & Remove Scripts Enhancement
**User Query:** automatically handle deployment naming and vault retrieval for teardown  
**Action:**
- Updated `scripts/deploy_bicep.sh` to include `--name main` on the deployment commands for a stable identifier.  
- Modified `scripts/remove_infra.sh` to auto-fetch the `keyVaultName` from the Bicep deployment outputs when not passed as an argument, simplifying cleanup.

## 2025-05-09

### 13. Remove Infra Script Vault Detection Fix
**User Query:** remove_infra.sh fails to detect Key Vault name for purge
**Action:** Enhanced `scripts/remove_infra.sh` to robustly determine the Key Vault name: try Bicep deployment outputs, fallback to listing active vaults in the resource group, and error if still not found.

## 2025-05-10

### 14. Manage Resource Groups Script
**User Query:** add script to list and delete resource groups interactively  
**Action:** Created `scripts/manage_resource_groups.sh` to list all resource groups in the subscription, present a numbered menu for selection, and issue deletion commands via Azure CLI.

### 15. Contribution Helper Script
**User Query:** add script for colleagues to contribute in the correct GitHub way  
**Action:** Created `scripts/contribute.sh` leveraging GitHub CLI (`gh`) to scaffold feature branches off `main`, guide commits and pushes, and simplify pull request creation.

## 2025-05-11

### 16. Enhanced remove_infra.sh Interactivity
**User Query:** add functionality to list and delete all resources in a resource group and prompt before deleting the group  
**Action:** Refactored `scripts/remove_infra.sh` to:
- Prompt and allow selection of the target Resource Group if not provided.
- List all resources within the group, numbered, with an option to delete all non-Key Vault resources interactively.
- Prompt to delete the Resource Group after resource cleanup.
- Detect and optionally purge Key Vault separately.

## 2025-05-12

### 17. Recovery Services Vault Deletion Handling
**User Query:** remove_infra.sh fails to delete a Recovery Services vault with soft-deleted backup items  
**Action:** Enhanced `scripts/remove_infra.sh` to detect `Microsoft.RecoveryServices/vaults` resources and delete them using `az backup vault delete`, with warnings if manual purge of backup items is required.

## 2025-05-16

### 22. Log Analytics Workspace Deletion Handling
**User Query:** manage_infra.sh fails to delete OperationalInsights workspace resource  
**Action:** Updated `scripts/manage_infra.sh` to detect `Microsoft.OperationalInsights/workspaces` resources and delete them with `az monitor log-analytics workspace delete`; falls back to generic `az resource delete` if needed.

### 23. App Service Plan Deletion Handling and Safe-Mode Resource Delete
**User Query:** manage_infra.sh fails to delete App Service plan and exits on errors  
**Action:**
- Added detection for `Microsoft.Web/serverfarms` resources and used `az appservice plan delete` with error handling.
- Wrapped generic `az resource delete` calls in `if` blocks to catch failures and log warnings instead of aborting the script.

## 2025-05-17

### 24. Contribute Script Stash Handling
**User Query:** Feature branch checkout fails if there are local changes  
**Action:** Updated `scripts/contribute.sh` to automatically stash any local changes before creating a feature branch and reapply them after checkout, preventing overwrite errors.

### 25. Git Push Authentication Guidance
**User Query:** `fatal: Authentication failed` due to removed password auth  
**Action:** Enhanced `scripts/git_push.sh` to catch push failures and instruct the user to authenticate via SSH or the GitHub CLI (`gh auth login`) when HTTP password auth is not available.

## 2025-05-18

### 26. Simplify Dev Container Startup
**User Query:** can you adjust the readme, once the dev container is spun up i can just start up everything by running npm run dev
**Action:** Updated `README.md` to streamline development startup:
- In **Quick Start**, replaced separate frontend and backend commands with a single `npm run dev`.
- In **Local Development**, simplified the `Running Locally` section to use `npm run dev` after spinning up SQL Edge and installing dependencies.

## 2025-05-19

### 27. Fix Azure Functions Startup & Scaffold API Tests
**User Query:** ok i that's good, i did npm run dev and the server is running but im getting errors and the site it just this, continue building out the server, make sure to not do things you already tried. try to replicate talentlms but better and use markdown for test
**Action:**
- Updated `api/functions/package.json` to use `npx azure-functions-core-tools@4` in the start script for reliable local CLI resolution.
- Created `docs/api_tests.md` with initial markdown-based API tests for Hello, Courses, and Quiz endpoints.

### 28. Modules & Enrollments Endpoints
**User Query:** yes keep going please
**Action:**
- Added `Modules` function under `api/functions/Modules` supporting GET (list, single, filter by `courseId`) and POST (create module).
- Added `Enrollments` function under `api/functions/Enrollments` supporting GET (all enrollments or by `userId`) and POST (create enrollment).
- Updated `docs/api_tests.md` with test cases for Modules and Enrollments endpoints.

### 29. Progress Endpoint
**User Query:** keep going
**Action:**
- Added `Progress` function under `api/functions/Progress` supporting GET (all progress, by `userId`, by `userId` + `moduleId`) and POST (create/update progress entries).
- Updated `docs/api_tests.md` with test cases for the Progress endpoint.

### 30. Users Endpoint
**User Query:** continue
**Action:**
- Created `Users` function under `api/functions/Users` with GET (list users, get by `id`) and POST (create user), handling unique email constraint.
- Updated `docs/api_tests.md` with test cases for the Users endpoint.

### 31. Course & Module Update/Delete
**User Query:** continue
**Action:**
- Extended `api/functions/Courses` to handle PUT (update course fields) and DELETE (remove course) methods in `function.json` and `index.js`.
- Added Markdown test cases in `docs/api_tests.md` for `PUT /api/courses/{id}` and `DELETE /api/courses/{id}`.
- Extended `api/functions/Modules` to handle PUT (update module fields) and DELETE (remove module) methods in `function.json` and `index.js`.
- Added Markdown test cases in `docs/api_tests.md` for `PUT /api/modules/{id}` and `DELETE /api/modules/{id}`.

*End of development log.* 