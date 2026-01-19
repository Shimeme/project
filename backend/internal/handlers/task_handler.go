package handlers

import (
	"net/http"

	"guildquest/internal/models"
	"guildquest/internal/services"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	taskService services.TaskService
}

func NewTaskHandler(taskService services.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

func (h *TaskHandler) CreateBulkTasks(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "CreateBulkTasks not implemented",
	})
}

func (h *TaskHandler) CompleteTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "CompleteTask not implemented",
	})
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "DeleteTask not implemented",
	})
}

// GetTasks godoc
// @Summary Get all tasks
// @Tags tasks
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.Task
// @Router /tasks [get]
func (h *TaskHandler) GetTasks(c *gin.Context) {
	userID := parseUUID(c.GetString("userID"))

	tasks, err := h.taskService.GetTasks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Fetch failed",
			Code:  "FETCH_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

// CreateTask godoc
// @Summary Create task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateTaskRequest true "Task"
// @Success 201 {object} models.Task
// @Router /tasks [post]
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid request",
			Code:  "INVALID_REQUEST",
		})
		return
	}

	userID := parseUUID(c.GetString("userID"))
	task, err := h.taskService.CreateTask(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Create failed",
			Code:  "CREATE_FAILED",
		})
		return
	}

	c.JSON(http.StatusCreated, task)
}
