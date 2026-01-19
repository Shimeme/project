// cmd/server/main.go
package main

import (
	"log"
	"os"

	"guildquest/internal/config"
	"guildquest/internal/database"
	"guildquest/internal/handlers"
	"guildquest/internal/middleware"
	"guildquest/internal/repositories"
	"guildquest/internal/routes"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "guildquest/docs" // Swagger docs
)

// @title GuildQuest API
// @version 1.0
// @description Production-ready gamified task management system with virtual pet
// @termsOfService https://guildquest.io/terms

// @contact.name API Support
// @contact.url https://guildquest.io/support
// @contact.email support@guildquest.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	taskRepo := repositories.NewTaskRepository(db)
	petRepo := repositories.NewPetRepository(db)
	decorationRepo := repositories.NewDecorationRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	taskService := services.NewTaskService(taskRepo, petRepo, userRepo)
	petService := services.NewPetService(petRepo, userRepo)
	decorationService := services.NewDecorationService(decorationRepo, userRepo)
	syncService := services.NewSyncService(taskRepo, petRepo, decorationRepo)
	inviteService := services.NewInviteService(cfg.JWTSecret, cfg.AppURL)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	taskHandler := handlers.NewTaskHandler(taskService)
	petHandler := handlers.NewPetHandler(petService)
	decorationHandler := handlers.NewDecorationHandler(decorationService)
	syncHandler := handlers.NewSyncHandler(syncService)
	inviteHandler := handlers.NewInviteHandler(inviteService)

	// Setup Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(middleware.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Setup routes
	api := router.Group("/api/v1")
	routes.SetupRoutes(api, authHandler, taskHandler, petHandler, decorationHandler, syncHandler, inviteHandler, cfg.JWTSecret)
	// Health check
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting GuildQuest server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
