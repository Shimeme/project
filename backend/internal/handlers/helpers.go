package handlers

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parseUUIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID := c.GetString("userID")
	if userID == "" {
		return uuid.Nil, errors.New("userID not found in context")
	}
	return uuid.Parse(userID)
}
