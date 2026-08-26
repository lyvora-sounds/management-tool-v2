.PHONY: help setup dev run build lint db-push db-migrate db-target db-generate db-studio mcp clean

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║                   Kikiboard Commands                       ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make setup        Install dependencies & sync database"
	@echo "  make dev          Start development server (http://localhost:3000)"
	@echo "  make run          Alias for 'make dev'"
	@echo "  make db-migrate   Create & apply a schema migration (name=...)"
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
	pnpm prisma migrate deploy
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
	@echo "   Usa:  make db-migrate name=descripcion_del_cambio"
	@exit 1

# Crea y aplica una migración, confirmando antes contra qué base se ejecuta
db-migrate:
	@if [ -z "$(name)" ]; then \
		echo "❌ Falta el nombre. Uso: make db-migrate name=descripcion_del_cambio"; exit 1; fi
	@echo "⚠️  Vas a modificar el esquema de esta base:"
	@pnpm prisma migrate status 2>&1 | grep -i "^Datasource" || true
	@printf "   Escribe 'si' para continuar: "; \
		read r; [ "$$r" = "si" ] || { echo "   Cancelado."; exit 1; }
	pnpm prisma migrate dev --name $(name)

# Muestra a qué base apuntas ahora mismo
db-target:
	@pnpm prisma migrate status 2>&1 | grep -i "^Datasource" || true

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
