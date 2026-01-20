package main

import (
	"log"
	"os"
	"path/filepath"

	"guildquest/internal/config"
	"guildquest/internal/database"
	"guildquest/internal/middleware"
	"guildquest/internal/routes"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "guildquest/docs"
)

func main() {
	cfg := config.Load()

	// DB
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		log.Fatalf("DB migration failed: %v", err)
	}

	// Handlers
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(middleware.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	// Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ===== FRONTEND =====
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	frontendDist := filepath.Join(wd, "..", "frontend", "dist")

	router.Static("/assets", filepath.Join(frontendDist, "assets"))

	router.GET("/", func(c *gin.Context) {
		c.File(filepath.Join(frontendDist, "index.html"))
	})

	router.NoRoute(func(c *gin.Context) {
		c.File(filepath.Join(frontendDist, "index.html"))
	})

	// ===== API =====
	api := router.Group("/api/v1")

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	routes.SetupRoutesWithAuth(api, db, cfg.JWTSecret)
	// Start
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("GuildQuest running on port %s", port)
	log.Printf("Frontend dir: %s", frontendDist)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
