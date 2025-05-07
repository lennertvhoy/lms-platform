#!/usr/bin/env bash
set -euo pipefail

# Script to list Azure resource groups and delete selected ones interactively

if ! az account show > /dev/null 2>&1; then
  echo "Please login with 'az login' and set the correct subscription." >&2
  exit 1
fi

TEMP_FILE=$(mktemp)
az group list --query '[].name' -o tsv > "$TEMP_FILE"

if ! [ -s "$TEMP_FILE" ]; then
  echo "No resource groups found."
  rm "$TEMP_FILE"
  exit 0
fi

echo "Available resource groups:"
nl -w2 -s'. ' "$TEMP_FILE"

echo
read -p "Enter the numbers of the resource groups to delete (e.g. 1 3 5): " -a selections

echo
for idx in "${selections[@]}"; do
  RG=$(sed -n "${idx}p" "$TEMP_FILE")
  if [ -n "$RG" ]; then
    echo "Deleting resource group: $RG"
    az group delete --name "$RG" --yes --no-wait
  else
    echo "Invalid selection: $idx"
  fi
done

rm "$TEMP_FILE"
echo "Deletion commands issued." 