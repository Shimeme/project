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

// CreateBulkTasks godoc
// @Summary Create bulk tasks
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BulkTaskRequest true "Tasks"
// @Success 201 {array} models.Task
// @Router /tasks/bulk [post]
func (h *TaskHandler) CreateBulkTasks(c *gin.Context) {
	var req models.BulkTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid request",
			Code:  "INVALID_REQUEST",
		})
		return
	}

	userID := parseUUID(c.GetString("userID"))
	tasks, err := h.taskService.CreateBulkTasks(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Bulk create failed",
			Code:  "BULK_CREATE_FAILED",
		})
		return
	}

	c.JSON(http.StatusCreated, tasks)
}

// CompleteTask godoc
// @Summary Complete task
// @Tags tasks
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 200 {object} models.Task
// @Router /tasks/{id}/complete [post]
func (h *TaskHandler) CompleteTask(c *gin.Context) {
	taskID := parseUUID(c.Param("id"))
	userID := parseUUID(c.GetString("userID"))

	task, err := h.taskService.CompleteTask(userID, taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
			Code:  "COMPLETE_FAILED",
		})
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask godoc
// @Summary Delete task
// @Tags tasks
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 204 "No Content"
// @Router /tasks/{id} [delete]
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID := parseUUID(c.Param("id"))
	userID := parseUUID(c.GetString("userID"))

	if err := h.taskService.DeleteTask(userID, taskID); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: err.Error(),
			Code:  "DELETE_FAILED",
		})
		return
	}

	c.Status(http.StatusNoContent)
}
