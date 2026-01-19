package handlers

import (
	"net/http"

	"guildquest/internal/models"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
)

type DecorationHandler struct {
	decorationService services.DecorationService
}

func NewDecorationHandler(decorationService services.DecorationService) *DecorationHandler {
	return &DecorationHandler{decorationService: decorationService}
}

// GetDecorations godoc
// @Summary Get owned decorations
// @Description Get all decorations owned by user
// @Tags decorations
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Decoration
// @Failure 401 {object} models.ErrorResponse
// @Router /decorations [get]
func (h *DecorationHandler) GetDecorations(c *gin.Context) {
	userID := parseUUID(c.GetString("userID"))
	decorations, err := h.decorationService.GetDecorations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to fetch decorations",
			Code:  "FETCH_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, decorations)
}

// BuyDecoration godoc
// @Summary Buy decoration
// @Description Purchase a decoration (costs 50 gold)
// @Tags decorations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BuyDecorationRequest true "Decoration to buy"
// @Success 200 {object} map[string]string
// @Failure 400 {object} models.ErrorResponse
// @Router /decorations/buy [post]
func (h *DecorationHandler) BuyDecoration(c *gin.Context) {
	var req models.BuyDecorationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid request body",
			Code:  "INVALID_REQUEST",
		})
		return
	}

	userID := parseUUID(c.GetString("userID"))
	err := h.decorationService.BuyDecoration(userID, req.Decoration)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
			Code:  "PURCHASE_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Decoration purchased successfully"})
}
