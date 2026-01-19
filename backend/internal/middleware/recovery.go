package middleware

import (
	"log"
	"net/http"

	"guildquest/internal/models"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic recovered: %v", err)
				c.JSON(http.StatusInternalServerError, models.ErrorResponse{
					Error: "Internal server error",
					Code:  "INTERNAL_ERROR",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
