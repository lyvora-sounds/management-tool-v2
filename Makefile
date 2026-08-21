.PHONY: help setup dev run build lint db-push db-generate db-studio mcp clean

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                   Kikiboard Commands                       ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make setup        Install dependencies & sync database"
	@echo "  make dev          Start development server (http://localhost:3000)"
	@echo "  make run          Alias for 'make dev'"
	@echo "  make db-push      Push schema updates to database"
	@echo "  make db-generate  Regenerate Prisma client types"
	@echo "  make db-studio    Open Prisma Studio database GUI"
	@echo "  make build        Build for production"
	@echo "  make lint         Run linter check"
	@echo "  make mcp          Start MCP server for Claude/Cursor"
	@echo "  make clean        Clean build artifacts (.next)"
	@echo ""

# Full setup (install, generate prisma client, push schema)
setup:
	@echo "🚀 Setting up Kikiboard..."
	pnpm install
	pnpm prisma generate
	pnpm prisma db push
	@echo "✅ Setup complete! Run 'make dev' to start the app."

# Start development server
dev:
	@echo "🌐 Starting Kikiboard at http://localhost:3000..."
	pnpm dev

# Alias for dev
run: dev

# Database commands
db-generate:
	@echo "📦 Generating Prisma client..."
	pnpm prisma generate

db-push:
	@echo "🔄 Pushing schema changes to Postgres database..."
	pnpm prisma db push

db-studio:
	@echo "📊 Opening Prisma Studio GUI..."
	pnpm prisma studio

# Build & quality
build:
	@echo "🛠️  Building Kikiboard for production..."
	pnpm build

lint:
	@echo "🔍 Running linter..."
	pnpm lint

# MCP Server
mcp:
	@echo "🤖 Starting Kikiboard MCP Server..."
	cd mcp && npx tsx server.ts

# Clean temporary files
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
