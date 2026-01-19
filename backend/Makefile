.PHONY: help build run test clean migrate swagger docker-up docker-down install

# Default target
help:
	@echo "GuildQuest Backend - Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make swagger      - Generate Swagger documentation"
	@echo "  make build        - Build the application"
	@echo "  make run          - Run the application"
	@echo "  make test         - Run tests"
	@echo "  make migrate      - Run database migrations"
	@echo "  make docker-up    - Start PostgreSQL with Docker"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make dev          - Run in development mode with hot reload"

# Install dependencies
install:
	@echo "Installing dependencies..."
	go mod download
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "✓ Dependencies installed"

# Generate Swagger documentation
swagger:
	@echo "Generating Swagger documentation..."
	swag init -g cmd/server/main.go -o docs
	@echo "✓ Swagger docs generated"

# Build the application
build: swagger
	@echo "Building application..."
	go build -o bin/guildquest cmd/server/main.go
	@echo "✓ Build complete"

# Run the application
run: swagger
	@echo "Starting GuildQuest server..."
	go run cmd/server/main.go

# Run tests
test:
	@echo "Running tests..."
	go test -v -cover ./...

# Run database migrations
migrate:
	@echo "Running database migrations..."
	go run cmd/server/main.go migrate

# Start PostgreSQL with Docker
docker-up:
	@echo "Starting PostgreSQL container..."
	docker run --name guildquest-postgres \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=postgres \
		-e POSTGRES_DB=guildquest \
		-p 5432:5432 \
		-d postgres:15-alpine
	@echo "✓ PostgreSQL started on port 5432"
	@echo "  Database: guildquest"
	@echo "  User: postgres"
	@echo "  Password: postgres"

# Stop Docker containers
docker-down:
	@echo "Stopping PostgreSQL container..."
	docker stop guildquest-postgres
	docker rm guildquest-postgres
	@echo "✓ Container stopped and removed"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -rf docs/
	@echo "✓ Clean complete"

# Development mode with hot reload (requires air)
dev:
	@if ! command -v air > /dev/null; then \
		echo "Installing air for hot reload..."; \
		go install github.com/cosmtrek/air@latest; \
	fi
	@echo "Starting development server with hot reload..."
	air

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...
	@echo "✓ Code formatted"

# Lint code
lint:
	@if ! command -v golangci-lint > /dev/null; then \
		echo "Installing golangci-lint..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
	fi
	@echo "Running linter..."
	golangci-lint run

# Run all checks (format, lint, test)
check: fmt lint test
	@echo "✓ All checks passed"

# Production build
build-prod:
	@echo "Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o bin/guildquest cmd/server/main.go
	@echo "✓ Production build complete"
