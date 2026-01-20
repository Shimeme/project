package handlers

import (
	"net/http"

	"guildquest/internal/models"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
)

type PetHandler struct {
	petService services.PetService
}

func NewPetHandler(petService services.PetService) *PetHandler {
	return &PetHandler{petService: petService}
}

func (h *PetHandler) FeedPet(c *gin.Context) {
	userID := parseUUID(c.GetString("userID"))

	pet, err := h.petService.FeedPet(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Feed failed",
			Code:  "FEED_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, pet)
}

func (h *PetHandler) PlayWithPet(c *gin.Context) {
	userID := parseUUID(c.GetString("userID"))

	pet, err := h.petService.PlayWithPet(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Play failed",
			Code:  "PLAY_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, pet)
}

// GetPet godoc
// @Summary Get pet
// @Tags pet
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Pet
// @Router /pet [get]
func (h *PetHandler) GetPet(c *gin.Context) {
	userID := parseUUID(c.GetString("userID"))
	pet, err := h.petService.GetPet(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Fetch failed",
			Code:  "FETCH_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, pet)
}
