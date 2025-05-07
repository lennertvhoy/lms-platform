@description('Name prefix for all resources')
param resourcePrefix string = 'lms'

@description('Azure region for deployment')
param location string = 'northeurope'

@description('Azure region for Static Web App deployment')
param staticLocation string = 'westeurope'

@description('Administrator login for SQL server')
param sqlAdminUsername string

@secure()
@description('Administrator password for SQL server')
param sqlAdminPassword string

@description('SKU for the Function App service plan')
param servicePlanSku string = 'P1v2'

// Storage account for blobs
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${resourcePrefix}sa'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

// Application Insights for telemetry
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-ai'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// App Service plan for Functions and Static Web
resource servicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${resourcePrefix}-plan'
  location: location
  sku: {
    name: servicePlanSku
    tier: 'PremiumV2'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-func'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: servicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storageAccount.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=SQL_PASSWORD)'
        }
        {
          name: 'OPENAI_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=OPENAI_KEY)'
        }
        {
          name: 'OPENAI_ENDPOINT'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=OPENAI_ENDPOINT)'
        }
        {
          name: 'SEARCH_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=SEARCH_KEY)'
        }
      ]
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Python UpdateContent Function App
resource updateContentFunc 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-updatefunc'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: servicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'AzureWebJobsStorage'
          value: storageAccount.properties.primaryEndpoints.blob
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=SQL_PASSWORD)'
        }
      ]
      linuxFxVersion: 'Python|3.9'
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Add Azure App Service Web App for Next.js frontend
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-webapp'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: servicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'NEXT_PUBLIC_API_URL'
          value: 'https://${functionApp.properties.defaultHostName}/api'
        }
      ]
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
  dependsOn: [ functionApp ]
}

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: '${resourcePrefix}-sql'
  location: location
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
  }
}

// SQL Database
resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01' = {
  name: '${resourcePrefix}-sqldb'
  parent: sqlServer
  properties: {
    sku: {
      name: 'GP_Gen5_2'
      tier: 'GeneralPurpose'
    }
    maxSizeBytes: 2147483648
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: '${resourcePrefix}-kv-07052025'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
    enableSoftDelete: true
  }
}

// Output important endpoints
output functionEndpoint string = functionApp.properties.defaultHostName
output sqlServerName string = sqlServer.name
output storageAccountName string = storageAccount.name
