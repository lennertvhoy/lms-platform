#!/usr/bin/env bash
# Arch Linux prerequisite installer for the LMS platform

set -euo pipefail

echo "Updating system packages..."
sudo pacman -Syu --noconfirm

echo "Installing Docker..."
sudo pacman -S --noconfirm docker

echo "Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "Prerequisites installed successfully." 