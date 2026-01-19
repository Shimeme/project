package handlers

import (
	"net/http"

	"guildquest/internal/models"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
)

type InviteHandler struct {
	inviteService services.InviteService
}

func NewInviteHandler(inviteService services.InviteService) *InviteHandler {
	return &InviteHandler{inviteService: inviteService}
}

func (h *InviteHandler) GetInvite(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "GetInvite not implemented",
	})
}

func (h *InviteHandler) CreateInvite(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "CreateInvite not implemented",
	})
}

// GetInviteQR godoc
// @Summary Get invite QR
// @Tags invite
// @Produce image/png
// @Param token path string true "Invite token"
// @Success 200 {file} png
// @Router /invite/{token}/qr [get]
func (h *InviteHandler) GetInviteQR(c *gin.Context) {
	token := c.Param("token")

	_, err := h.inviteService.ValidateInvite(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid token",
			Code:  "INVALID_TOKEN",
		})
		return
	}

	url := c.Request.Host + "/invite/" + token
	png, err := qrcode.Encode(url, qrcode.Medium, 256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "QR failed",
			Code:  "QR_FAILED",
		})
		return
	}

	c.Data(http.StatusOK, "image/png", png)
}
