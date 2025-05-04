#!/usr/bin/env bash
set -euo pipefail

# Ensure Azure CLI is logged in and subscription is set
if ! az account show > /dev/null 2>&1; then
  echo "Please login with 'az login' and set the correct subscription." >&2
  exit 1
fi

RESOURCE_GROUP=${RESOURCE_GROUP:-lms-rg}
BICEP_FILE="infra/main.bicep"

if [ ! -f "$BICEP_FILE" ]; then
  echo "Bicep file $BICEP_FILE not found." >&2
  exit 1
fi

echo "Deploying infrastructure to resource group '$RESOURCE_GROUP'..."
az group create --name "$RESOURCE_GROUP" --location eastus2

# Deploy Bicep
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$BICEP_FILE" \
  --parameters \
      sqlAdminUsername="sqladmin" \
      sqlAdminPassword="YourStrongP@ssw0rd"

echo "Infra deployment complete." 