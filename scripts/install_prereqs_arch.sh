#!/usr/bin/env bash
# Arch Linux prerequisite installer for the LMS platform

set -euo pipefail

echo "Updating system packages..."
sudo pacman -Syu --noconfirm

echo "Installing Docker, Node.js, npm, Azure CLI, and VS Code..."
sudo pacman -S --noconfirm docker nodejs npm azure-cli code

echo "Installing Azure Functions Core Tools globally via npm..."
sudo NPM_CONFIG_UNSAFE_PERM=true npm install -g azure-functions-core-tools@4

echo "Prerequisites installed successfully." 