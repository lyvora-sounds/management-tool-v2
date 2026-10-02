.PHONY: help setup dev run build lint test db-push db-migrate db-migration db-target db-generate db-studio mcp clean

DB_ENV_FILE ?= .env.development

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                   Kikiboard Commands                       ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make setup        Install dependencies & sync database"
	@echo "  make dev          Start development server (http://localhost:3000)"
	@echo "  make run          Alias for 'make dev'"
	@echo "  make db-migrate   Apply committed migrations to a verified development branch"
	@echo "  make db-migration Create a migration on that same branch (name=...)"
	@echo "  make db-target    Show which database you are pointing at"
	@echo "  make db-generate  Regenerate Prisma client types"
	@echo "  make db-studio    Open Prisma Studio database GUI"
	@echo "  make build        Build for production"
	@echo "  make lint         Run linter check"
	@echo "  make mcp          Start MCP server for Claude/Cursor"
	@echo "  make clean        Clean build artifacts (.next)"
	@echo ""

# Full setup (install, generate prisma client, apply migrations)
setup:
	@echo "🚀 Setting up Kikiboard..."
	pnpm install
	$(MAKE) db-migrate
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
	@echo "❌ 'prisma db push' está deshabilitado."
	@echo "   Reescribe el esquema sin pasar por migraciones y ya tiró producción dos veces."
	@echo "   Para aplicar migraciones ya commiteadas: make db-migrate"
	@echo "   Para crear una: make db-migration name=descripcion_del_cambio"
	@exit 1

# Applies committed migrations only after branch identity verification.
# Put development URLs and EXPECTED_NEON_BRANCH_ID in .env.development.
db-migrate:
	@test -f "$(DB_ENV_FILE)" || { echo "❌ Missing $(DB_ENV_FILE). Refusing to use .env implicitly."; exit 1; }
	DOTENV_CONFIG_PATH=$(DB_ENV_FILE) node scripts/verify-db-target.mjs --write
	DOTENV_CONFIG_PATH=$(DB_ENV_FILE) pnpm prisma migrate deploy

# Creates a migration, but only after the same branch check as db-migrate.
db-migration:
	@if [ -z "$(name)" ]; then \
		echo "❌ Falta el nombre. Uso: make db-migration name=descripcion_del_cambio"; exit 1; fi
	@test -f "$(DB_ENV_FILE)" || { echo "❌ Missing $(DB_ENV_FILE). Refusing to use .env implicitly."; exit 1; }
	DOTENV_CONFIG_PATH=$(DB_ENV_FILE) node scripts/verify-db-target.mjs --write
	DOTENV_CONFIG_PATH=$(DB_ENV_FILE) pnpm prisma migrate dev --name $(name)

# Muestra a qué base apuntas ahora mismo
db-target:
	@test -f "$(DB_ENV_FILE)" || { echo "❌ Missing $(DB_ENV_FILE)."; exit 1; }
	DOTENV_CONFIG_PATH=$(DB_ENV_FILE) node scripts/verify-db-target.mjs

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

test:
	pnpm test

# MCP Server
mcp:
	@echo "MCP is served by the Next.js app at http://localhost:3000/api/mcp"
	@echo "Run 'make dev' and configure a board-scoped bearer token."

# Clean temporary files
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
