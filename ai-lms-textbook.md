# AI-Integrated LMS Textbook

Welcome to the advanced DevSecOps course focused on building a fully AI-powered Learning Management System (LMS) on Microsoft Azure. This textbook will guide you *step by step* through every component, configuration, and best practice in the `lms-platform` monorepo.

---

## Table of Contents

1. [Introduction & Learning Objectives](#introduction--learning-objectives)
2. [Monorepo Structure](#monorepo-structure)
3. [Local Development Environment](#local-development-environment)
   1. VS Code Dev Containers & Docker Compose
   2. SQL Edge for Local Development
4. [Workspace Configuration](#workspace-configuration)
   1. Root `package.json` & npm Workspaces
   2. `.gitignore` Best Practices
5. [Frontend: Next.js Application](#frontend-nextjs-application)
   1. `apps/portal/package.json`
   2. TypeScript and ESLint Setup
   3. Global Types and `tsconfig.json`
   4. Pages: Home, Courses List, Course Detail, Create Course
   5. UI Security: NextAuth Azure AD B2C Integration
6. [Backend: Azure Functions](#backend-azure-functions)
   1. Project Layout in `api/functions`
   2. Hello World Function
   3. Prisma Client Integration
   4. Courses HTTP Trigger: CRUD Endpoints
   5. Quiz Generation Function (Azure OpenAI)
   6. Content Update Timer Trigger (Python)
7. [Database: Prisma & Azure SQL](#database-prisma--azure-sql)
   1. `packages/db/prisma/schema.prisma`
   2. Migrations and Seed Script
   3. Security: Connection Strings & Key Vault References
8. [Shared UI Components](#shared-ui-components)
9. [Infrastructure as Code: Bicep Templates](#infrastructure-as-code-bicep-templates)
   1. `infra/main.bicep` Resources:
      - Storage Account
      - App Service Plan
      - Function Apps (Node & Python)
      - Static Web App
      - SQL Server & Database
      - Key Vault
      - App Insights
   2. Key Vault References & Managed Identities
   3. Deployment Script: `scripts/deploy_infra.sh`
10. [CI/CD Pipelines with GitHub Actions](#cicd-pipelines-with-github-actions)
    1. CI Workflow: Lint, Test, Migrations
    2. CD Workflow: Bicep Deploy, Functions Publish, SWA Deploy
11. [DevSecOps Best Practices](#devsecops-best-practices)
    1. Secret Management & Key Vault
    2. Infrastructure Guardrails & Policies
    3. Code Quality & Static Analysis
    4. Dependency Scanning & Automated Patching
    5. Logging, Monitoring & Alerting
    6. Secure Network & Identity Management
12. [Conclusion & Next Steps](#conclusion--next-steps)

---

## 1. Introduction & Learning Objectives

In this course, you will learn how to:

- Design a **modular monorepo** for a full-stack application using Next.js, Azure Functions, and Prisma.
- Configure **local development** with Docker, dev containers, and Azure SQL Edge.
- Implement **serverless backends** for HTTP and timer triggers, including AI-powered endpoints using Azure OpenAI.
- Model and manage a relational database using **Prisma** and **Azure SQL Database**.
- Deploy and manage resources on Azure using **Bicep** and **GitHub Actions**.
- Integrate **Azure AD B2C** for secure authentication (NextAuth).
- Apply **DevSecOps** practices: secret management, static analysis, CI/CD, and monitoring.

By the end, you will have built and deployed a production-ready, AI-driven LMS with secure DevSecOps pipelines.

---

## 2. Monorepo Structure

The monorepo follows an npm-workspaces layout. At the root:

```
.lms-platform/
├── apps/portal               # Next.js frontend application
├── api/functions            # Azure Functions backend (Node)
├── packages/db              # Prisma schema & migrations
├── packages/ui-lib          # Shared React components (future)
├── functions/UpdateContentFunction  # Azure Function (Python) for content updates
├── infra/                   # Bicep templates for Azure resources
├── scripts/                 # Deployment scripts (bash)
├── .devcontainer/           # VS Code dev container config (Docker Compose)
├── .github/workflows/       # GitHub Actions CI/CD
├── package.json             # Root npm workspaces definition
├── .gitignore
└── README.md
```

### Why Workspaces?
- **Isolated development**: install deps per package while sharing lockfile.
- **Atomic commands**: run scripts across packages (e.g. `npm run dev`).

---

## 3. Local Development Environment

### 3.1. VS Code Dev Containers & Docker Compose

`.devcontainer/devcontainer.json` sets up:
- **Node.js 18** container for code editing.
- **Docker Compose** launches SQL Edge for local Azure SQL emulation.
- **Extensions**: Azure Functions, Cosmos DB, ESLint, Prettier.
- **Forwarded ports**: 3000 (Next.js), 7071 (Functions).
- **Post-create command** installs dependencies across workspaces.

```jsonc
// .devcontainer/devcontainer.json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "forwardPorts": [3000, 7071],
  "postCreateCommand": "npm install"
}
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    image: mcr.microsoft.com/vscode/devcontainers/javascript-node:0-18
    volumes:
      - .:/workspace:cached
    command: sleep infinity
  mssql:
    image: mcr.microsoft.com/azure-sql-edge
    environment:
      ACCEPT_EULA: 'Y'
      MSSQL_SA_PASSWORD: 'YourStrong!Passw0rd'
    ports:
      - '1433:1433'
```

### 3.2. SQL Edge for Local Development
- Azure SQL Edge replicates SQL Server features locally.
- Connection string in `local.settings.json` and `.env.example`:
  ```
  DATABASE_URL="sqlserver://sa:YourStrong!Passw0rd@localhost:1433;database=lms;trustServerCertificate=true;encrypt=false"
  ```
- Prisma uses this URL to run migrations and seed data.

---

## 4. Workspace Configuration

### 4.1. Root `package.json`
Defines npm workspaces and helper scripts:
```jsonc
{
  "private": true,
  "workspaces": ["apps/*","api/*","packages/*"],
  "scripts": {
    "dev": "npm --workspace=apps/portal run dev & npm --workspace=api/functions run start",
    "build": "npm --workspace=apps/portal run build && npm --workspace=api/functions run build",
    "deploy-infra": "bash ./scripts/deploy_infra.sh"
  }
}
```

### 4.2. `.gitignore`
Ignore node_modules, build artifacts, VS Code settings, environment files, OS artifacts:
```gitignore
node_modules/
.next/
.env*
.vscode/
.DS_Store
```

---

## 5. Frontend: Next.js Application

### 5.1. `apps/portal/package.json`
Sets up Next.js with TypeScript and ESLint:
```jsonc
{
  "scripts": { "dev": "next dev", "build": "next build", "start":"next start" },
  "dependencies": { "react": "^18", "next": "^12" },
  "devDependencies": { "typescript":"^4","@types/react":"^18","eslint":"^8","prettier":"^2" }
}
```

### 5.2. TypeScript & ESLint
- `tsconfig.json` enables JSX, strict mode, and includes `next-env.d.ts` and `global.d.ts`.
- Global types in `apps/portal/global.d.ts` declare `process.env` keys:
  ```ts
  declare namespace NodeJS { interface ProcessEnv { NEXT_PUBLIC_API_URL: string; NODE_ENV: string; } }
  declare const process: { env: NodeJS.ProcessEnv };
  ```
- ESLint config extends `next` defaults.

### 5.3. Pages
- **Home**: `pages/index.tsx` calls `/api/hello`.
- **Courses**:
  - `pages/courses/index.tsx`: list courses.
  - `pages/courses/[id].tsx`: detail with modules.
  - `pages/courses/create.tsx`: form to create new course.
- **Auth**:
  - `_app.tsx` wraps pages in `<SessionProvider />`.
  - `pages/api/auth/[...nextauth].ts` configures Azure AD B2C via `next-auth`.

### 5.4. Service Client
`apps/portal/services/api.ts` exports typed functions:
```ts
export async function getCourses(): Promise<Course[]> { ... }
export async function getCourse(id:number) { ... }
export async function createCourse(data) { ... }
export async function getHello(): Promise<string> { ... }
```

## 6. Backend: Azure Functions

Azure Functions provide a serverless compute environment for our backend logic. We have four key function groups:

1. **Hello** – a simple HTTP trigger to verify connectivity.
2. **Courses** – CRUD API endpoints using Prisma and Azure SQL.
3. **Quiz** – HTTP trigger integrating with Azure OpenAI for quiz generation.
4. **UpdateContentFunction** – a Python timer trigger to ingest RSS feeds and update training content automatically.

### 6.1 Hello Function

Purpose: Verify end-to-end connectivity between Next.js frontend and Azure Functions.

File: `api/functions/Hello/index.js`
```javascript
module.exports = async function (context, req) {
  context.log('HTTP trigger processed a request.');
  context.res = { status: 200, body: 'Hello from Azure Functions!' };
};
```
Configuration: `Hello/function.json` defines the HTTP GET route `/hello`:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"],
      "route": "hello"
    },
    { "type": "http", "direction": "out", "name": "res" }
  ]
}
```

### 6.2 Prisma Client Integration

We instantiate a single `PrismaClient` to reuse across invocations:

File: `api/functions/prismaClient.js`
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

Local settings: `api/functions/local.settings.json` provides `DATABASE_URL` for local development.

### 6.3 Courses CRUD Function

Implements GET `/courses`, GET `/courses/{id}`, and POST `/courses`.

File: `api/functions/Courses/function.json`
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get","post"],
      "route": "courses/{id?}"
    },
    { "type": "http", "direction": "out", "name": "res" }
  ]
}
```

File: `api/functions/Courses/index.js`
```javascript
const prisma = require('../prismaClient');
module.exports = async (context, req) => {
  // GET list or single
  // POST create
  // Error handling
};
```

### 6.4 Quiz Generation Function

Integrates with Azure OpenAI to generate 5 MCQs from provided content.

File: `api/functions/Quiz/function.json`
```json
{
  "bindings": [
    {"authLevel":"anonymous","type":"httpTrigger","direction":"in","name":"req","methods":["post"],"route":"quiz"},
    {"type":"http","direction":"out","name":"res"}
  ]
}
```

File: `api/functions/Quiz/index.js`
```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY, endpoint: process.env.OPENAI_ENDPOINT });
module.exports = async (context, req) => {
  const { content } = req.body || {};
  const response = await openai.chat.completions.create({ /* parameters */ });
  context.res = { status:200, body: response.choices[0].message.content };
};
```

### 6.5 Content Update Timer Trigger (Python)

Fetches RSS feeds daily and inserts new updates into `dbo.Updates` table.

File: `functions/UpdateContentFunction/function.json`
```json
{ "bindings": [ {"name":"mytimer","type":"timerTrigger","direction":"in","schedule":"0 0 * * * *"} ] }
```

File: `functions/UpdateContentFunction/__init__.py`
```python
import pyodbc, requests, xml.etree.ElementTree as ET
# Connect, ensure table, insert new items
```

Dependencies in `requirements.txt`: `azure-functions`, `pyodbc`, `requests`.

---

## 7. Database: Prisma & Azure SQL

### 7.1 Prisma Schema

File: `packages/db/prisma/schema.prisma`
```prisma
datasource db { provider = "sqlserver" url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }
model Course { id Int @id @default(autoincrement()) title String description String? modules Module[] }
...other models...
```

### 7.2 Migrations & Client
- Commands:
  ```bash
  cd packages/db
  npx prisma migrate dev --name init
  npx prisma generate
  ```

### 7.3 Seeding Data
File: `packages/db/prisma/seed.js` creates sample courses and modules.

Run:
```bash
npm run seed
```

### 7.4 Security
- **DATABASE_URL** stored in Key Vault and referenced in Function App via Bicep:
  ```bicep
  { name:'DATABASE_URL', value:'@Microsoft.KeyVault(...SecretName=SQL_PASSWORD)' }
  ```

---

## 8. Shared UI Components

Folder `packages/ui-lib` is reserved for shared React components (buttons, forms) for future reuse. Initialize with a `package.json`.

---

## 9. Infrastructure as Code: Bicep Templates

File: `infra/main.bicep` provisions:
- Storage Account (blobs)
- App Service Plan (PremiumV2)
- Function Apps (Node & Python) with Managed Identity
- Static Web App for Next.js
- Azure SQL Server & Database
- Application Insights for telemetry
- Key Vault for secret storage

Key snippet:
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@...'
resource servicePlan 'Microsoft.Web/serverfarms@...'
resource functionApp 'Microsoft.Web/sites@...'
resource staticWeb 'Microsoft.Web/staticSites@...'
resource sqlServer 'Microsoft.Sql/servers@...'
resource keyVault 'Microsoft.KeyVault/vaults@...'
```

### 9.1 Managed Identities & Key Vault
- Each Function App uses SystemAssigned identity to fetch secrets.
- Bicep uses `@Microsoft.KeyVault` references in `siteConfig.appSettings`.

### 9.2 Deploy Script
`scripts/deploy_infra.sh` logs in, creates RG, and runs:
```bash
az deployment group create -g $RG -f infra/main.bicep --parameters sqlAdminUsername ...
```

---

## 10. CI/CD Pipelines with GitHub Actions

### 10.1 CI Workflow: `.github/workflows/ci.yml`
- Triggers: push & PR on `main`
- Services: SQL Edge container
- Steps: checkout, setup-node, `npm install`, run migrations, lint Functions & Frontend

### 10.2 CD Workflow: `.github/workflows/deploy.yml`
- Trigger: push on `main`
- Steps: Azure login, deploy Bicep, install deps, publish Functions via `func`, deploy Static Web App

Secrets used:
- `AZURE_CREDENTIALS` (for `azure/login`),
- `RESOURCE_GROUP`, `AZURE_REGION`, `SQL_ADMIN`, `SQL_PASSWORD`,
- `FUNCTION_APP_NAME`, `SWA_TOKEN`, `NEXTAUTH_SECRET`, etc.

---

## 11. DevSecOps Best Practices

1. **Secret Management**: All sensitive values in Azure Key Vault. Access via Managed Identity.
2. **Infrastructure Guardrails**: Use Bicep to enforce resource types and SKUs.
3. **Static Analysis**: ESLint, Prettier, Prisma migrations.
4. **Dependency Scanning**: GitHub Dependabot for JS & Python.
5. **Logging & Monitoring**: Application Insights in all Function Apps.
6. **Network Security**: Use private endpoints, restrict Function App access.
7. **Identity & Access**: Azure AD B2C for user auth, RBAC for admins & instructors.
8. **Automated Testing**: Unit tests for JS code and integration tests mocking Functions.

---

## 12. Conclusion & Next Steps

You now have a **production-ready, AI-driven LMS** fully integrated with Azure services, CI/CD, and DevSecOps practices. Next, consider:

- Extending the AI modules (feedback, personalization).
- Adding interactive labs via Azure Lab Services.
- Enabling global distribution with Azure Front Door.
- Implementing multi-tenant isolation if serving multiple organizations.
- Fine-tuning your own Azure OpenAI model with domain-specific data.

---

**Congratulations** on completing this advanced DevSecOps journey! 