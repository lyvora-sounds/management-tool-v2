.PHONY: help setup dev run build lint test test-e2e test-e2e-headed test-e2e-app test-e2e-app-headed test-e2e-app-ui mcp clean

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                   Kikiboard Commands                       ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make setup        Install dependencies"
	@echo "  make dev          Start development server (http://localhost:3000)"
	@echo "  make run          Alias for 'make dev'"
	@echo "  make build        Build for production"
	@echo "  make lint         Run linter check"
	@echo "  make test         Run unit tests"
	@echo "  make test-e2e     Run Playwright component E2E tests"
	@echo "  make test-e2e-headed      Run Playwright component E2E tests in Chromium"
	@echo "  make test-e2e-app         Run full-app Playwright E2E tests (http://localhost:3000)"
	@echo "  make test-e2e-app-headed  Watch full-app Playwright E2E walkthrough in Chromium"
	@echo "  make test-e2e-app-ui      Open Playwright interactive UI mode for full-app E2E tests"
	@echo "  make mcp          Start MCP server for Claude/Cursor"
	@echo "  make clean        Clean build artifacts (.next)"
	@echo ""

# Full setup (install)
setup:
	@echo "🚀 Setting up Kikiboard..."
	pnpm install
	@echo "✅ Setup complete! Run 'make dev' to start the app."

# Start development server
dev:
	@echo "🌐 Starting Kikiboard at http://localhost:3000..."
	pnpm dev

# Alias for dev
run: dev

# Build & quality
build:
	@echo "🛠️  Building Kikiboard for production..."
	pnpm build

lint:
	@echo "🔍 Running linter..."
	pnpm lint

test:
	pnpm test

test-e2e:
	pnpm test:e2e

test-e2e-headed:
	pnpm test:e2e:headed

test-e2e-app:
	pnpm test:e2e:app

test-e2e-app-headed:
	pnpm test:e2e:app:headed

test-e2e-app-ui:
	pnpm test:e2e:app:ui

# MCP Server
mcp:
	@echo "MCP is served by kiki-api (/v1/mcp). This app forwards /api/mcp to it when NEXT_PUBLIC_API_URL is set."
	@echo "Run 'make dev' and configure a board-scoped bearer token."

# Clean temporary files
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
