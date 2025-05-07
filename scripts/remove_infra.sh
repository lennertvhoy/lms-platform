#!/usr/bin/env bash
set -euo pipefail

# Interactive script to clean up Azure resources and resource groups

if ! az account show > /dev/null 2>&1; then
  echo "Please login with 'az login' and set the correct subscription." >&2
  exit 1
fi

# Select Resource Group
if [ -z "${1:-}" ]; then
  echo "Available Resource Groups:"
  mapfile -t rgs < <(az group list --query '[].name' -o tsv)
  if [ "${#rgs[@]}" -eq 0 ]; then
    echo "No resource groups found."
    exit 0
  fi
  for i in "${!rgs[@]}"; do
    printf "%3d) %s\n" $((i+1)) "${rgs[i]}"
  done
  echo
  read -p "Select Resource Group number to operate on: " sel
  RG="${rgs[$((sel-1))]}"
else
  RG="$1"
fi

# Confirm RG exists
if ! az group show --name "$RG" > /dev/null 2>&1; then
  echo "Resource Group '$RG' not found." >&2
  exit 1
fi

# Detect Key Vault in RG for later purge
mapfile -t kvs < <(az keyvault list --resource-group "$RG" --query '[].name' -o tsv)
kvName="${kvs[0]:-}"
if [ -n "$kvName" ]; then
  echo "Detected Key Vault: $kvName"
fi

echo
# List resources in the group
mapfile -t resIds < <(az resource list --resource-group "$RG" --query '[].id' -o tsv)
if [ "${#resIds[@]}" -gt 0 ]; then
  echo "Resource Group '$RG' contains ${#resIds[@]} resources:"
  for i in "${!resIds[@]}"; do
    printf "%3d) %s\n" $((i+1)) "${resIds[i]}"
  done
  echo
  read -p "Do you want to delete ALL non-Key Vault resources in '$RG'? (y/N): " confirm
  if [[ "$confirm" =~ ^[Yy] ]]; then
    for id in "${resIds[@]}"; do
      # Skip Key Vault resources; will purge later
      if [[ "$id" == *"/providers/Microsoft.KeyVault/vaults/"* ]]; then
        echo "Skipping Key Vault resource (will purge later): $id"
        continue
      fi
      # Handle Recovery Services vaults via Backup CLI
      if [[ "$id" == */providers/Microsoft.RecoveryServices/vaults/* ]]; then
        vaultName="${id##*/}"
        echo "Deleting Recovery Services vault via Azure Backup CLI: $vaultName"
        if ! az backup vault delete --name "$vaultName" --resource-group "$RG" --yes; then
          echo "Warning: could not delete Recovery Services vault $vaultName. Please ensure backup items are purged manually." >&2
        fi
        continue
      fi
      # General resource deletion
      echo "Deleting resource: $id"
      az resource delete --ids "$id"
    done
    echo "All non-Key Vault resources deleted."
  fi
else
  echo "No resources found in Resource Group '$RG'."
fi

echo
# Confirm deletion of the Resource Group
read -p "Do you want to delete the Resource Group '$RG'? (y/N): " confirmRg
if [[ "$confirmRg" =~ ^[Yy] ]]; then
  echo "Deleting Resource Group '$RG'..."
  az group delete --name "$RG" --yes --no-wait
  az group wait --name "$RG" --deleted
  echo "Resource Group deleted."
else
  echo "Skipping Resource Group deletion."
fi

echo
# Purge Key Vault if detected
if [ -n "$kvName" ]; then
  read -p "Do you want to purge Key Vault '$kvName'? (y/N): " confirmKv
  if [[ "$confirmKv" =~ ^[Yy] ]]; then
    echo "Purging Key Vault '$kvName'..."
    az keyvault purge --name "$kvName"
    echo "Key Vault purged."
  fi
fi

echo "Cleanup completed." 