# AI-Integrated LMS Platform

**A local-first, production-ready Learning Management System (LMS) powered by AI, built on Microsoft Azure.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license) [![GitHub Actions](https://img.shields.io/github/workflow/status/your-org/lms-platform/CI?label=CI)](#ci-cd-pipelines) [![Azure Bicep](https://img.shields.io/badge/infra-Bicep-blue)](#infrastructure-bicep)

---

## Overview

This monorepo delivers a full-stack LMS solution featuring:

- **Next.js** portal with **Azure AD B2C** authentication.
- **Azure Functions** (Node.js & Python) as serverless backend.
- **Prisma** ORM with **Azure SQL Database**.
- **AI-driven** quiz generation using **Azure OpenAI**.
- Automated content ingestion via RSS with a Python timer function.
- Infrastructure as code via **Bicep** templates.
- CI/CD pipelines using **GitHub Actions**.
- DevSecOps best practices: Key Vault, Managed Identity, linting, and automated tests.


## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Local Development](#local-development)
5. [Database Setup](#database-setup)
6. [Frontend (Next.js)](#frontend-nextjs)
7. [Backend (Azure Functions)](#backend-azure-functions)
8. [Infrastructure (Bicep)](#infrastructure-bicep)
9. [CI/CD Pipelines](#ci-cd-pipelines)
10. [Deployment to Azure](#deployment-to-azure)
11. [Contributing](#contributing)
12. [License](#license)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (for Dev Container & Azure SQL Edge)
- **Cursor** + Remote - Containers extension
- **Github-CLI** installed to authorize connection to GitHub.
   >sudo apt install gh
   >gh auth login
On Azure:

- An **Azure subscription**.
- **Azure AD B2C** tenant for user authentication.
- Provisioned **Azure OpenAI** and **Cognitive Search** (optional) services.

---

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/lennertvhoy/lms-platform.git
   cd lms-platform
   ```

2. Open in Cursor and launch the Dev Container:
   ```bash
   code .
   ```
   Accept prompts to reopen in the container.

3. Inside the Dev Container, bring up SQL Edge and install dependencies:
   ```bash
   docker-compose up -d mssql
   npm install
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

5. Configure environment variables:
   - Copy `apps/portal/.env.local.example` to `apps/portal/.env.local` and set `NEXT_PUBLIC_API_URL`:  
     ```env
     NEXT_PUBLIC_API_URL=http://host.docker.internal:7071/api
     ```
   - In `api/functions/local.settings.json`, ensure:
     ```json
     {
       "IsEncrypted": false,
       "Values": {
         "FUNCTIONS_WORKER_RUNTIME": "node",
         "AzureWebJobsStorage": "UseDevelopmentStorage=true"
       }
     }
     ```

6. Run Prisma migrations and seed data:
   ```bash
   cd packages/db
   npx prisma migrate dev --name init
   npm run seed
   ```

7. Verify:
   - Open http://localhost:3000 → you should see the portal home page.
   - Visit http://localhost:7071/api/hello → returns "Hello from Azure Functions!"

---

## Project Structure

```
.lms-platform/
├── apps/portal                  # Next.js React frontend
├── api/functions               # Node.js Azure Functions backend
├── packages/db                 # Prisma schema & migrations
├── packages/ui-lib             # Shared React components (future)
├── functions/UpdateContentFunction # Python Azure Function for RSS ingestion
├── infra                       # Bicep templates for Azure resources
├── scripts                     # Deployment & utility scripts
├── .devcontainer               # VS Code Dev Container & Docker Compose
├── .github/workflows           # GitHub Actions CI/CD
├── package.json                # Root npm workspaces definition
├── docker-compose.yml          # Local SQL Edge service
└── README.md                   # Project documentation
```

---

## Local Development

### Dev Container & Docker Compose

- `.devcontainer/devcontainer.json`: Defines a Node.js 18 container that mounts the workspace and forwards ports 3000 & 7071.
- `docker-compose.yml`: Spins up Azure SQL Edge on port 1433 for local database emulation.

### Running Locally

```bash
# Bring up SQL Edge
docker-compose up -d mssql

# Install dependencies
npm install

npm run dev
```

---

## Database Setup

The project uses **Prisma** ORM with a **SQL Server** database.

1. Define data models in `packages/db/prisma/schema.prisma`.
2. Run migrations:
   ```bash
   cd packages/db
   npx prisma migrate dev --name init
   npx prisma generate
   ```
3. Seed sample data:
   ```bash
   npm run seed
   ```

Connection string is read from `DATABASE_URL` (local or Key Vault).

---

## Frontend (Next.js)

Located in `apps/portal`.

- **Pages**:
  - `/` – Home calls `/api/hello`
  - `/courses` – List all courses
  - `/courses/[id]` – Course detail & modules
  - `/courses/create` – Create new course
- **Authentication**: NextAuth with Azure AD B2C configured in `pages/api/auth/[...nextauth].ts`.
- **API Client**: `services/api.ts` wraps fetch calls to the Functions backend.
- **Styling & Linting**: ESLint (`eslint-config-next`) and Prettier.

---

## Backend (Azure Functions)

Located in `api/functions` (Node.js) and `functions/UpdateContentFunction` (Python).

1. **Hello**: HTTP GET `/api/hello` → smoke test.
2. **Courses**: HTTP trigger supports GET (list/detail) and POST (create) using Prisma.
3. **Quiz**: HTTP POST `/api/quiz` calls Azure OpenAI to generate MCQs.
4. **UpdateContentFunction**: Python timer trigger (`0 0 * * * *`) ingests RSS feeds and updates the database.

Config files:
- `function.json`: Bindings and routes for each function.
- `local.settings.json`: Local environment values.

---

## Infrastructure (Bicep)

All Azure resources are defined in `infra/main.bicep`:

- **Storage Account** for blob storage
- **App Service Plan** for Functions
- **Function Apps** (Node & Python) with Managed Identities
- **Web App** (Next.js frontend) on App Service
- **Azure SQL Server & Database**
- **Key Vault** for secrets
- **Application Insights** for telemetry

Use the infrastructure deployment helper script:
```bash
./scripts/deploy_bicep.sh [RESOURCE_GROUP] [LOCATION] [PARAMETERS_FILE] [SQL_ADMIN_USER] [SQL_ADMIN_PASSWORD]
```
This logs in (if needed), creates or updates the resource group, and applies the Bicep template.

To tear down or manage resources interactively:
```bash
./scripts/manage_infra.sh
```
This lists available resource groups, lets you select resources to delete, deletes the group, and purges Key Vaults.

---

## CI/CD Pipelines

Defined under `.github/workflows`:

- **ci.yml**: Runs on PRs and pushes to `main`. Steps:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run Prisma migrations
  - Lint frontend & backend

- **deploy.yml**: Runs on push to `main`. Steps:
  - Azure login (`AZURE_CREDENTIALS` secret)
  - Deploy Bicep infra
  - Install dependencies
  - Publish Functions (`func azure functionapp publish`)
  - Build & deploy Next.js frontend to App Service (`azure/webapps-deploy@v2`)

Ensure repository secrets are set:
- `AZURE_CREDENTIALS`
- `RESOURCE_GROUP`, `AZURE_REGION`
- `SQL_ADMIN`, `SQL_PASSWORD`
- `FUNCTION_APP_NAME`, `WEBAPP_NAME`, `AZURE_WEBAPP_PUBLISH_PROFILE`, `NEXTAUTH_SECRET`

---

## Deployment to Azure

1. **Login & Subscription**:
   ```bash
   az login
   az account set --subscription "<SUBSCRIPTION_ID>"
   ```
2. **Infrastructure Deployment**:
   ```bash
   ./scripts/deploy_bicep.sh
   ```
3. **Secrets**: Add SQL connection string, OpenAI key, NextAuth secret, etc., to Key Vault.
4. **Front-end Deployment**:
   ```bash
   cd apps/portal
   npm install
   npm run build
   az webapp deploy --resource-group <RESOURCE_GROUP> --name <WEBAPP_NAME> --src-path .next
   ```
5. **Cleanup (Optional)**:
   ```bash
   ./scripts/manage_infra.sh
   ```

---

## Contributing

We welcome contributions! You can use our helper script or follow the manual workflow:
```bash
./scripts/contribute.sh
```
Alternatively, manually:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/awesome-feature`.
3. Commit your changes and run existing tests and linters.
4. Open a pull request describing your changes.

Refer to [docs/Implementation_Guide.md](docs/Implementation_Guide.md) for architecture and coding standards.

---

## License

This project is licensed under the [MIT License](LICENSE).

## Development Log

- **Remote Container Launch Failure:** Fixed `dockerComposeFile` in `.devcontainer/devcontainer.json`.
- **Next.js NetworkError Fetching API:** Updated environment configuration and rewrites in `next.config.js`.
- **Wrong Container Context:** Use `docker-compose exec app bash` for Node shell.
- **Working Directory Fix:** Added `working_dir: /workspace` to `docker-compose.yml`.
- **Missing Azure Functions Core Tools:** Installed in `postCreateCommand` of dev container.
- **Container Rebuild Recommendation:** Run **Remote-Containers: Rebuild Container** after devcontainer changes.