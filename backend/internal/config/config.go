// internal/config/config.go
package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment string
	DatabaseURL string
	JWTSecret   string
	AppURL      string
	Port        string
}

func Load() *Config {
	// Load .env file if exists (for local development)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/guildquest?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		AppURL:      getEnv("APP_URL", "http://localhost:8080"),
		Port:        getEnv("PORT", "8080"),
	}

	// Validate required fields in production
	if cfg.Environment == "production" {
		if cfg.JWTSecret == "your-secret-key-change-in-production" {
			log.Fatal("JWT_SECRET must be set in production")
		}
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
