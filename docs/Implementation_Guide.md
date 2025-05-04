# AI-Integrated LMS Platform — Implementation Guide

This document provides **end-to-end instructions** to build, deploy, and run an AI-powered Learning Management System (LMS) on Azure, using Next.js frontend, Azure Functions backend, Azure SQL Database, Azure AD B2C for authentication, and Azure OpenAI/Cognitive Services for AI features. By following these steps, you will have a working platform with automated infrastructure provisioning and CI/CD.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Repository Structure](#repository-structure)
4. [Local Development Setup](#local-development-setup)
5. [Azure Resources and Configuration](#azure-resources-and-configuration)
6. [Infrastructure as Code (Bicep)](#infrastructure-as-code-bicep)
7. [Environment Variables and Secrets](#environment-variables-and-secrets)
8. [Continuous Integration / Continuous Deployment (CI/CD)](#continuous-integration--continuous-deployment-cicd)
9. [AI Integration with Azure OpenAI & Cognitive Services](#ai-integration-with-azure-openai--cognitive-services)
10. [Deployment and Validation](#deployment-and-validation)
11. [Next Steps and Maintenance](#next-steps-and-maintenance)

---

## 1. Architecture Overview

```text
User Browser
   ↓ HTTPS
Azure Static Web Apps (Next.js) —───•
                                   | API Requests
Azure Front Door/CDN               ↓
                             Azure App Service (Functions)
   ↕                             ↕        ↕
Azure AD B2C (Auth)         Azure SQL   Azure Blob
                              Database   Storage
                                 ↕        ↕
                        Azure OpenAI  Azure Cognitive Search
                        & Form Recognizer
```  

- **Frontend**: Next.js SPA served via Azure Static Web Apps for global performance. Uses React + TypeScript.  
- **Backend**: Azure Functions (Node.js/TypeScript) implements REST API for courses, users, quizzes, and AI features.  
- **Authentication**: Azure AD B2C issues JWT tokens; Functions validate tokens.  
- **Database**: Azure SQL holds relational data: Users, Courses, Modules, Progress, Quizzes.  
- **Storage**: Azure Blob Storage serves videos, images, and documents.  
- **AI Services**: Azure OpenAI for content generation, Azure Cognitive Search for semantic retrieval, Azure Form Recognizer for PDF OCR.  

---

## 2. Prerequisites

Before you begin, ensure you have:

- An **Azure subscription** with permissions to create resources.  
- **Azure CLI** installed (az CLI >=2.2).  
- **Node.js** (v18 LTS) and **npm**.  
- **Git** to clone the repository.  
- **VS Code** (optional) with the Remote - Containers extension for dev container support.  
- **Docker Desktop** to run the local SQL Edge container and dev container.  
- Access to **Azure OpenAI Service** (contact Microsoft to enable).  

---

## 3. Repository Structure

Below is the top-level repo layout:

```
lms-platform/
├── README.md
├── docs/
│   └── Implementation_Guide.md    # This file
├── .devcontainer/
│   ├── devcontainer.json
│   └── docker-compose.yml
├── apps/
│   └── portal/                    # Next.js frontend
├── api/
│   └── functions/                 # Azure Functions project
├── packages/
│   ├── db/                        # Prisma schema + migrations
│   └── ui-lib/                    # shared React components
├── infra/
│   └── main.bicep                 # Bicep IaC for Azure
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
└── scripts/
    └── deploy_infra.sh            # Azure CLI wrapper
```

---

## 4. Local Development Setup

### 4.1. Clone and Open in VS Code Dev Container

```bash
git clone https://github.com/<your-org>/lms-platform.git
cd lms-platform
# Open in VS Code and let it launch the dev container
code .
```

The dev container provides:
- Node.js 18 runtime
- Azure Functions Core Tools
- SQL Edge container for local Azure SQL compatibility

### 4.2. Configure Local SQL

1. In `docker-compose.yml`, SQL Edge is exposed on port 1433 with strong SA credentials.  
2. Once containers are up, run migrations:

```bash
cd packages/db
npx prisma migrate dev --name init --schema=./schema.prisma
```

### 4.3. Run Frontend & API Locally

From the dev container terminal:

```bash
# Start Azure Functions
cd api/functions
npm install && npm run start

# In a separate terminal
cd apps/portal
npm install && npm run dev
```

- **Functions** will listen on http://localhost:7071  
- **Next.js** will run on http://localhost:3000  

Ensure that the frontend’s `NEXT_PUBLIC_API_URL` points to `http://host.docker.internal:7071/api` and SQL connection string in env points to `localhost,1433`.

---

## 5. Azure Resources and Configuration

### 5.1. Create Resource Group

```bash
az group create -n myLmsRG -l eastus2
```

### 5.2. Deploy Infrastructure with Bicep

```bash
cd infra
az deployment group create -g myLmsRG -f main.bicep -p \
  lmsAppName='lms-webapp' \
  sqlAdminUsername='sqladmin' \
  sqlAdminPassword='<YourStrongP@ssw0rd>'
```

### 5.3. Configure Azure AD B2C

1. Create or use existing Azure AD B2C tenant.  
2. Register two applications:  
   - **Portal App** (SPA) with redirect URI `https://<your-domain>/`, grant implicit grant for `access_token` and `id_token`.  
   - **API App** with scope `api.scope` and expose an API.  
3. In B2C > User flows, create sign-up/sign-in flow.  
4. Note the tenant name and application (client) IDs for environment variables.

### 5.4. Provision Azure OpenAI & Cognitive Search (Manual)

> Currently, Azure OpenAI and Cognitive Search resources are provisioned via the Azure Portal. Obtain:
> - **OPENAI_ENDPOINT**, **OPENAI_KEY**, **SEARCH_ENDPOINT**, **SEARCH_KEY**.

### 5.5. Configure Key Vault & App Settings

1. Create an Azure Key Vault and add secrets:
   - `SQL_PASSWORD`, `OPENAI_KEY`, `SEARCH_KEY`, `B2C_CLIENT_SECRET`.
2. Link Key Vault secrets to your App Service and Function App configuration (via Azure Portal > Configuration > Key Vault references).

---

## 6. Infrastructure as Code (Bicep)

Path: `infra/main.bicep`

```bicep
// ... existing code from template above ...
```

This template provisions:
- App Service Plan + Web App for Functions  
- Azure SQL Server + Database  
- Storage Account (for blobs)  
- Application Insights  

Customize parameters as needed for your naming and sizing requirements.

---

## 7. Environment Variables and Secrets

| Name                        | Purpose                                       | Set in                        |
| --------------------------- | --------------------------------------------- | ----------------------------- |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage access                        | Function App & Web App config |
| `SQL_SERVER`, `SQL_DB`, `SQL_USER`, `SQL_PASSWORD` | SQL DB connection             | Key Vault & App Settings      |
| `B2C_TENANT`, `B2C_CLIENT_ID`, `B2C_CLIENT_SECRET`, `B2C_POLICY` | Azure AD B2C auth              | Both apps                      |
| `OPENAI_ENDPOINT`, `OPENAI_KEY` | Azure OpenAI Service access                  | Function App config           |
| `SEARCH_ENDPOINT`, `SEARCH_KEY` | Azure Cognitive Search access                | Function App config           |

Be sure to store all sensitive values in Key Vault and reference them in App Settings.

---

## 8. Continuous Integration / Continuous Deployment (CI/CD)

### 8.1. GitHub Actions - CI (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      mssql:
        image: mcr.microsoft.com/azure-sql-edge
        env:
          ACCEPT_EULA: Y
          MSSQL_SA_PASSWORD: YourStrong!Passw0rd
        ports: ['1433:1433']
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - name: Install dependencies
        run: |
          cd packages/db && npm install
          cd apps/portal   && npm install
          cd api/functions && npm install
      - name: Run migrations & tests
        run: |
          cd packages/db && npx prisma migrate deploy
          cd api/functions && npm test
          cd apps/portal   && npm test
      - name: Lint
        run: |
          cd apps/portal   && npm run lint
          cd api/functions && npm run lint
```

### 8.2. GitHub Actions - CD (`.github/workflows/deploy.yml`)

```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Azure Login
        uses: azure/login@v1
        with: { creds: ${{ secrets.AZURE_CREDENTIALS }} }
      - name: Deploy Bicep
        run: |
          az deployment group create -g myLmsRG -f infra/main.bicep -p \
            sqlAdminUsername='sqladmin' \
            sqlAdminPassword=${{ secrets.SQL_PASSWORD }}
      - name: Deploy Functions
        run: |
          cd api/functions
          npm run build
          func azure functionapp publish lmsFunctionsApp --typescript
      - name: Deploy Static Web App
        uses: Azure/static-web-apps-deploy@v1
        with: {
          azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN }},
          repo_token: ${{ secrets.GITHUB_TOKEN }},
          action: 'upload',
          app_location: 'apps/portal',
          output_location: '.next',
          api_location: 'api/functions'
        }
```

Replace resource names and secrets references as appropriate.

---

## 9. AI Integration with Azure OpenAI & Cognitive Services

1. **Initialize OpenAI client** in your Functions code:
   ```javascript
   import OpenAI from 'openai';
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_KEY,
     endpoint: process.env.OPENAI_ENDPOINT
   });
   ```
2. **Generate content** (e.g. quiz) endpoint:
   ```javascript
   export async function generateQuiz(context, req) {
     const { content } = req.body;
     const response = await openai.chat.completions.create({
       model: 'gpt-4',
       messages: [
         { role: 'system', content: 'You are an educational assistant...' },
         { role: 'user', content: `Create 5 MCQs from: ${content}` }
       ]
     });
     return context.res.json({ questions: response.choices[0].message.content });
   }
   ```
3. **Index content** for retrieval with Cognitive Search:
   - Use `@azure/search-documents` SDK to push extracted text into an index.  
   - In analysis pipeline, perform vector search to get relevant snippets.  

Refer to Azure SDK docs for code samples.

---

## 10. Deployment and Validation

1. **Push** all code to `main` branch.  
2. **Monitor** GitHub Actions; CI should pass, then CD will run.  
3. **Browse** the Static Web App URL to confirm frontend is live.  
4. **Test** authentication: sign in via B2C.  
5. **Invoke** API endpoints (e.g. `/api/health` or `/api/courses`) using Postman or browser.  
6. **Generate** a quiz via the UI (instructor role) and verify it appears.  
7. **Validate** AI features by testing edge cases.

---

## 11. Next Steps and Maintenance

- **Add more AI prompts**: experiment with personalization and adaptive learning.  
- **Scale resources**: adjust App Service scaling rules, SQL performance tier.  
- **Monitor cost**: review Azure Cost Management, optimize model usage (GPT-3.5 for bulk tasks).  
- **Enhance security**: enable WAF, private endpoints, and review audit logs.  
- **Extend** with features: interactive labs, webinars, SCORM import/export.

---

Congratulations! You now have a fully automated, Azure-hosted, AI-powered LMS platform. Follow this guide to iterate and adapt as your organization’s needs evolve.