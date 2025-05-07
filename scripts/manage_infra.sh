#!/usr/bin/env bash
set -euo pipefail

# Unified Azure Resource Group Manager & Cleanup Script
# Lists resource groups, allows selection, resource cleanup, RG deletion, and Key Vault purge

if ! az account show > /dev/null 2>&1; then
  echo "Please login with 'az login' and set the correct subscription." >&2
  exit 1
fi

# Fetch all resource groups
mapfile -t rgs < <(az group list --query '[].name' -o tsv)
if [ ${#rgs[@]} -eq 0 ]; then
  echo "No resource groups found."
  exit 0
fi

echo "Available Resource Groups:"
for i in "${!rgs[@]}"; do
  printf "%3d) %s\n" $((i+1)) "${rgs[i]}"
done

echo
read -p "Enter the numbers of resource groups to manage (e.g. 1 3 5): " -a selections

echo
for sel in "${selections[@]}"; do
  RG_NAME="${rgs[$((sel-1))]}"
  if [ -z "$RG_NAME" ]; then
    echo "Invalid selection: $sel"
    continue
  fi
  echo "=== Processing Resource Group '$RG_NAME' ==="

  # List resources in RG
  mapfile -t resIds < <(az resource list --resource-group "$RG_NAME" --query '[].id' -o tsv)
  if [ ${#resIds[@]} -gt 0 ]; then
    echo "Resources in '$RG_NAME':"
    for j in "${!resIds[@]}"; do
      printf "%3d) %s\n" $((j+1)) "${resIds[j]}"
    done
    echo
    # Choose deletion mode
    read -p "Delete ALL resources in '$RG_NAME'? (y/N): " deleteAll
    if [[ "$deleteAll" =~ ^[Yy] ]]; then
      toDelete=( "${resIds[@]}" )
    else
      read -p "Enter numbers of resources to delete (e.g. 1 3 5): " -a picks
      toDelete=()
      for idx in "${picks[@]}"; do
        id="${resIds[$((idx-1))]}"
        if [ -n "$id" ]; then
          toDelete+=( "$id" )
        else
          echo "Invalid selection: $idx"
        fi
      done
    fi
    # Delete selected resources
    for id in "${toDelete[@]}"; do
      case "$id" in
        */providers/Microsoft.KeyVault/vaults/*)
          kvName="${id##*/}"
          echo "Deleting Key Vault: $kvName"
          az keyvault delete --name "$kvName" --resource-group "$RG_NAME"
          ;;
        */providers/Microsoft.RecoveryServices/vaults/*)
          vaultName="${id##*/}"
          echo "Deleting Recovery Services vault: $vaultName"
          if az backup vault delete --name "$vaultName" --resource-group "$RG_NAME" --yes; then
            echo "Recovery Services vault $vaultName deleted."
          else
            echo "Vault deletion failed due to soft-deleted backup items. Attempting to permanently delete backup items..." >&2
            # List backup containers in vault (AzureIaasVM as default backup management type)
            containers=$(az backup container list --vault-name "$vaultName" --resource-group "$RG_NAME" --backup-management-type AzureIaasVM --query '[].name' -o tsv)
            for container in $containers; do
              # List soft-deleted backup items in container
              items=$(az backup item list --vault-name "$vaultName" --resource-group "$RG_NAME" --backup-management-type AzureIaasVM --container-name "$container" --query "[?properties.softDeleteStatus=='True'].name" -o tsv)
              for item in $items; do
                echo "Undeleting backup item: $item"
                az backup item undelete --vault-name "$vaultName" --resource-group "$RG_NAME" --backup-management-type AzureIaasVM --container-name "$container" --item-name "$item" --yes || true
                echo "Deleting backup data for item: $item"
                az backup protection disable --vault-name "$vaultName" --resource-group "$RG_NAME" --backup-management-type AzureIaasVM --container-name "$container" --item-name "$item" --delete-backup-data true --yes || true
              done
            done
            echo "Retrying vault deletion..."
            if az backup vault delete --name "$vaultName" --resource-group "$RG_NAME" --yes; then
              echo "Recovery Services vault $vaultName deleted after cleanup."
            else
              echo "Failed to delete Recovery Services vault $vaultName after cleanup. Please manually purge via portal: https://aka.ms/undeletesoftdeleteditems" >&2
            fi
          fi
          ;;
        */providers/Microsoft.OperationalInsights/workspaces/*)
          wsName="${id##*/}"
          echo "Deleting Log Analytics workspace: $wsName"
          if az monitor log-analytics workspace delete --resource-group "$RG_NAME" --workspace-name "$wsName" --yes; then
            echo "Log Analytics workspace $wsName deleted successfully."
          else
            echo "Warning: failed to delete workspace $wsName via CLI. Falling back to generic deletion..." >&2
            az resource delete --ids "$id" || echo "Error: could not delete workspace $id" >&2
          fi
          ;;
        */providers/Microsoft.Web/serverfarms/*)
          planName="${id##*/}"
          echo "Deleting App Service plan: $planName"
          if ! az appservice plan delete --name "$planName" --resource-group "$RG_NAME" --yes; then
            echo "Warning: failed to delete App Service plan: $planName" >&2
          fi
          ;;
        *)
          echo "Deleting resource: $id"
          if ! az resource delete --ids "$id"; then
            echo "Warning: failed to delete resource: $id" >&2
          fi
          ;;
      esac
    done
    echo "Selected resource deletion completed for '$RG_NAME'."
  else
    echo "No resources found in '$RG_NAME'."
  fi

  echo
  read -p "Delete Resource Group '$RG_NAME'? (y/N): " delRg
  if [[ "$delRg" =~ ^[Yy] ]]; then
    echo "Deleting Resource Group '$RG_NAME'..."
    az group delete --name "$RG_NAME" --yes --no-wait
    az group wait --name "$RG_NAME" --deleted
    echo "Resource Group '$RG_NAME' deleted."
  fi

  # Purge any Key Vaults
  mapfile -t kvs < <(az keyvault list --resource-group "$RG_NAME" --query '[].name' -o tsv)
  for kv in "${kvs[@]}"; do
    echo
    read -p "Purge Key Vault '$kv'? (y/N): " purgeKv
    if [[ "$purgeKv" =~ ^[Yy] ]]; then
      echo "Purging Key Vault: $kv"
      az keyvault purge --name "$kv"
    fi
  done

  echo
done

echo "All selected operations completed." 