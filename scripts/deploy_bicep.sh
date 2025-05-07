#!/usr/bin/env bash
set -euo pipefail

# Script to deploy Azure infrastructure using Bicep

if ! az account show > /dev/null 2>&1; then
  echo "Please login with 'az login' and set the correct subscription." >&2
  exit 1
fi

RESOURCE_GROUP=${1:-lms-rg}
LOCATION=${2:-eastus2}
# Determine script and root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Path to the Bicep template
BICEP_FILE="$ROOT_DIR/infra/main.bicep"
PARAMETERS=${3:-}

# SQL Admin credentials for Azure SQL
SQL_ADMIN_USER=${4:-sqladmin}
SQL_ADMIN_PWD=${5:-"ChangeM3Now!Secure"}

if [ ! -f "$BICEP_FILE" ]; then
  echo "Error: Bicep file '$BICEP_FILE' not found." >&2
  exit 1
fi

echo "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo "Deploying Bicep template..."
if [ -n "$PARAMETERS" ]; then
  az deployment group create \
    --name main \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_FILE" \
    --parameters sqlAdminUsername="$SQL_ADMIN_USER" sqlAdminPassword="$SQL_ADMIN_PWD" \
    --parameters @"$PARAMETERS"
else
  az deployment group create \
    --name main \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_FILE" \
    --parameters sqlAdminUsername="$SQL_ADMIN_USER" sqlAdminPassword="$SQL_ADMIN_PWD"
fi

echo "Deployment completed." 