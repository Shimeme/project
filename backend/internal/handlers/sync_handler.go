package handlers

import (
	"net/http"

	"guildquest/internal/models"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
)

type SyncHandler struct {
	syncService services.SyncService
}

func NewSyncHandler(syncService services.SyncService) *SyncHandler {
	return &SyncHandler{syncService: syncService}
}

// Sync godoc
// @Summary Sync data
// @Description Sync all user data (PWA offline support)
// @Tags sync
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.SyncRequest true "Last sync timestamp"
// @Success 200 {object} models.SyncResponse
// @Failure 400 {object} models.ErrorResponse
// @Router /sync [post]
func (h *SyncHandler) Sync(c *gin.Context) {
	var req models.SyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid request body",
			Code:  "INVALID_REQUEST",
		})
		return
	}

	userID := parseUUID(c.GetString("userID"))
	syncResp, err := h.syncService.Sync(userID, req.LastSyncAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Sync failed",
			Code:  "SYNC_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, syncResp)
}
