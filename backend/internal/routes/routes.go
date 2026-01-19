// internal/routes/routes.go
package routes

import (
	"guildquest/internal/handlers"
	"guildquest/internal/middleware"
	"guildquest/internal/repositories"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(
	router *gin.RouterGroup,
	authHandler *handlers.AuthHandler,
	taskHandler *handlers.TaskHandler,
	petHandler *handlers.PetHandler,
	decorationHandler *handlers.DecorationHandler,
	syncHandler *handlers.SyncHandler,
	inviteHandler *handlers.InviteHandler,
	jwtSecret string,
) {
	// Public routes
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Invite routes (mixed public/private)
	invite := router.Group("/invite")
	{
		invite.GET("/:token", inviteHandler.GetInvite)
		invite.GET("/:token/qr", inviteHandler.GetInviteQR)
	}

	// Create auth middleware instance
	// Note: This requires access to authService, so we need to modify this slightly
	// For now, we'll create a simple version that works with the existing setup
	authMiddleware := func(c *gin.Context) {
		// This is a placeholder - in real implementation, pass authService from main
		c.Next()
	}

	// Protected routes
	protected := router.Group("")
	protected.Use(authMiddleware)
	{
		// User profile
		protected.GET("/me", authHandler.GetMe)

		// Tasks
		tasks := protected.Group("/tasks")
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.POST("/bulk", taskHandler.CreateBulkTasks)
			tasks.POST("/:id/complete", taskHandler.CompleteTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}

		// Pet
		pet := protected.Group("/pet")
		{
			pet.GET("", petHandler.GetPet)
			pet.POST("/feed", petHandler.FeedPet)
			pet.POST("/play", petHandler.PlayWithPet)
		}

		// Decorations
		decorations := protected.Group("/decorations")
		{
			decorations.GET("", decorationHandler.GetDecorations)
			decorations.POST("/buy", decorationHandler.BuyDecoration)
		}

		// Sync
		protected.POST("/sync", syncHandler.Sync)

		// Invite creation (protected)
		protected.POST("/invite", inviteHandler.CreateInvite)
	}
}

// SetupRoutesWithAuth is the proper version that includes auth middleware
func SetupRoutesWithAuth(
	router *gin.RouterGroup,
	db *gorm.DB,
	jwtSecret string,
) {
	// Initialize all layers
	userRepo := repositories.NewUserRepository(db)
	taskRepo := repositories.NewTaskRepository(db)
	petRepo := repositories.NewPetRepository(db)
	decorationRepo := repositories.NewDecorationRepository(db)

	authService := services.NewAuthService(userRepo, jwtSecret)
	taskService := services.NewTaskService(taskRepo, petRepo, userRepo)
	petService := services.NewPetService(petRepo, userRepo)
	decorationService := services.NewDecorationService(decorationRepo, userRepo)
	syncService := services.NewSyncService(taskRepo, petRepo, decorationRepo)
	inviteService := services.NewInviteService(jwtSecret, "http://localhost:8080")

	authHandler := handlers.NewAuthHandler(authService)
	taskHandler := handlers.NewTaskHandler(taskService)
	petHandler := handlers.NewPetHandler(petService)
	decorationHandler := handlers.NewDecorationHandler(decorationService)
	syncHandler := handlers.NewSyncHandler(syncService)
	inviteHandler := handlers.NewInviteHandler(inviteService)

	// Public routes
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Public invite routes
	invite := router.Group("/invite")
	{
		invite.GET("/:token", inviteHandler.GetInvite)
		invite.GET("/:token/qr", inviteHandler.GetInviteQR)
	}

	// Protected routes with auth middleware
	protected := router.Group("")
	protected.Use(middleware.AuthMiddleware(authService))
	{
		// User profile
		protected.GET("/me", authHandler.GetMe)

		// Tasks
		tasks := protected.Group("/tasks")
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.POST("/bulk", taskHandler.CreateBulkTasks)
			tasks.POST("/:id/complete", taskHandler.CompleteTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}

		// Pet
		pet := protected.Group("/pet")
		{
			pet.GET("", petHandler.GetPet)
			pet.POST("/feed", petHandler.FeedPet)
			pet.POST("/play", petHandler.PlayWithPet)
		}

		// Decorations
		decorations := protected.Group("/decorations")
		{
			decorations.GET("", decorationHandler.GetDecorations)
			decorations.POST("/buy", decorationHandler.BuyDecoration)
		}

		// Sync
		protected.POST("/sync", syncHandler.Sync)

		// Invite creation (protected)
		protected.POST("/invite", inviteHandler.CreateInvite)
	}
}
