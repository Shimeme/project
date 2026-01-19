// internal/services/auth_service.go
package services

import (
	"errors"
	"time"

	"guildquest/internal/models"
	"guildquest/internal/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(email, password string) (*models.User, error)
	Login(email, password string) (*models.AuthResponse, error)
	ValidateToken(tokenString string) (uuid.UUID, error)
	GenerateTokens(userID uuid.UUID) (string, string, error)
}

type authService struct {
	userRepo  repositories.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repositories.UserRepository, jwtSecret string) AuthService {
	return &authService{userRepo: userRepo, jwtSecret: jwtSecret}
}

func (s *authService) Register(email, password string) (*models.User, error) {
	// Check if user exists
	if _, err := s.userRepo.FindByEmail(email); err == nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Gold:         0,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(email, password string) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	accessToken, refreshToken, err := s.GenerateTokens(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

func (s *authService) GenerateTokens(userID uuid.UUID) (string, string, error) {
	// Access token (1 hour)
	accessClaims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 1).Unix(),
		"type":    "access",
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", "", err
	}

	// Refresh token (7 days)
	refreshClaims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
		"type":    "refresh",
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func (s *authService) ValidateToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return uuid.Nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, errors.New("invalid token claims")
	}

	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return uuid.Nil, errors.New("invalid user_id in token")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, err
	}

	return userID, nil
}

// internal/services/task_service.go

type TaskService interface {
	CreateTask(userID uuid.UUID, req models.CreateTaskRequest) (*models.Task, error)
	CreateBulkTasks(userID uuid.UUID, req models.BulkTaskRequest) ([]models.Task, error)
	GetTasks(userID uuid.UUID) ([]models.Task, error)
	CompleteTask(userID uuid.UUID, taskID uuid.UUID) (*models.Task, error)
	DeleteTask(userID uuid.UUID, taskID uuid.UUID) error
}

type taskService struct {
	taskRepo repositories.TaskRepository
	petRepo  repositories.PetRepository
	userRepo repositories.UserRepository
}

func NewTaskService(taskRepo repositories.TaskRepository, petRepo repositories.PetRepository, userRepo repositories.UserRepository) TaskService {
	return &taskService{taskRepo: taskRepo, petRepo: petRepo, userRepo: userRepo}
}

func (s *taskService) CreateTask(userID uuid.UUID, req models.CreateTaskRequest) (*models.Task, error) {
	task := &models.Task{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Reward:      req.Reward,
		Completed:   false,
	}

	if err := s.taskRepo.Create(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *taskService) CreateBulkTasks(userID uuid.UUID, req models.BulkTaskRequest) ([]models.Task, error) {
	tasks := make([]models.Task, len(req.Tasks))
	for i, taskReq := range req.Tasks {
		tasks[i] = models.Task{
			UserID:      userID,
			Title:       taskReq.Title,
			Description: taskReq.Description,
			Reward:      taskReq.Reward,
			Completed:   false,
		}
	}

	if err := s.taskRepo.CreateBulk(tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (s *taskService) GetTasks(userID uuid.UUID) ([]models.Task, error) {
	return s.taskRepo.FindByUserID(userID)
}

func (s *taskService) CompleteTask(userID uuid.UUID, taskID uuid.UUID) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	if task.Completed {
		return nil, errors.New("task already completed")
	}

	// Mark task as complete
	if err := s.taskRepo.MarkComplete(taskID); err != nil {
		return nil, err
	}

	// Add gold to user
	currentGold, err := s.userRepo.GetGold(userID)
	if err != nil {
		return nil, err
	}
	if err := s.userRepo.UpdateGold(userID, currentGold+task.Reward); err != nil {
		return nil, err
	}

	// Update pet: +10 EXP, +5 happiness
	pet, err := s.petRepo.FindByUserID(userID)
	if err == nil {
		pet.Exp += 10
		pet.Happiness = clamp(pet.Happiness+5, 0, 100)

		// Check for level up
		requiredExp := pet.Level * 100
		if pet.Exp >= requiredExp {
			pet.Level++
			pet.Exp = 0
		}

		s.petRepo.Update(pet)
	}

	task.Completed = true
	return task, nil
}

func (s *taskService) DeleteTask(userID uuid.UUID, taskID uuid.UUID) error {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return errors.New("task not found")
	}

	if task.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.taskRepo.Delete(taskID)
}

// internal/services/pet_service.go

type PetService interface {
	GetPet(userID uuid.UUID) (*models.Pet, error)
	FeedPet(userID uuid.UUID) (*models.Pet, error)
	PlayWithPet(userID uuid.UUID) (*models.Pet, error)
	CreatePet(userID uuid.UUID) (*models.Pet, error)
}

type petService struct {
	petRepo  repositories.PetRepository
	userRepo repositories.UserRepository
}

func NewPetService(petRepo repositories.PetRepository, userRepo repositories.UserRepository) PetService {
	return &petService{petRepo: petRepo, userRepo: userRepo}
}

func (s *petService) GetPet(userID uuid.UUID) (*models.Pet, error) {
	pet, err := s.petRepo.FindByUserID(userID)
	if err != nil {
		// Create pet if doesn't exist
		return s.CreatePet(userID)
	}
	return pet, nil
}

func (s *petService) CreatePet(userID uuid.UUID) (*models.Pet, error) {
	pet := &models.Pet{
		UserID:    userID,
		Type:      "dragon",
		Level:     1,
		Exp:       0,
		Hunger:    100,
		Happiness: 100,
	}

	if err := s.petRepo.Create(pet); err != nil {
		return nil, err
	}

	return pet, nil
}

func (s *petService) FeedPet(userID uuid.UUID) (*models.Pet, error) {
	// Check gold
	gold, err := s.userRepo.GetGold(userID)
	if err != nil {
		return nil, err
	}

	if gold < 20 {
		return nil, errors.New("insufficient gold")
	}

	// Deduct gold
	if err := s.userRepo.UpdateGold(userID, gold-20); err != nil {
		return nil, err
	}

	// Update pet
	pet, err := s.petRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	pet.Hunger = clamp(pet.Hunger+30, 0, 100)
	pet.Happiness = clamp(pet.Happiness+10, 0, 100)

	if err := s.petRepo.Update(pet); err != nil {
		return nil, err
	}

	return pet, nil
}

func (s *petService) PlayWithPet(userID uuid.UUID) (*models.Pet, error) {
	pet, err := s.petRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	pet.Happiness = clamp(pet.Happiness+20, 0, 100)
	pet.Hunger = clamp(pet.Hunger-5, 0, 100)

	if err := s.petRepo.Update(pet); err != nil {
		return nil, err
	}

	return pet, nil
}

// internal/services/decoration_service.go

type DecorationService interface {
	GetDecorations(userID uuid.UUID) ([]models.Decoration, error)
	BuyDecoration(userID uuid.UUID, decoration string) error
}

type decorationService struct {
	decorationRepo repositories.DecorationRepository
	userRepo       repositories.UserRepository
}

func NewDecorationService(decorationRepo repositories.DecorationRepository, userRepo repositories.UserRepository) DecorationService {
	return &decorationService{decorationRepo: decorationRepo, userRepo: userRepo}
}

func (s *decorationService) GetDecorations(userID uuid.UUID) ([]models.Decoration, error) {
	return s.decorationRepo.FindByUserID(userID)
}

func (s *decorationService) BuyDecoration(userID uuid.UUID, decoration string) error {
	// Check if already owned
	exists, err := s.decorationRepo.Exists(userID, decoration)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("decoration already owned")
	}

	// Check gold
	gold, err := s.userRepo.GetGold(userID)
	if err != nil {
		return err
	}
	if gold < 50 {
		return errors.New("insufficient gold")
	}

	// Deduct gold
	if err := s.userRepo.UpdateGold(userID, gold-50); err != nil {
		return err
	}

	// Create decoration
	dec := &models.Decoration{
		UserID:     userID,
		Decoration: decoration,
	}

	return s.decorationRepo.Create(dec)
}

// internal/services/sync_service.go

type SyncService interface {
	Sync(userID uuid.UUID, lastSyncAt time.Time) (*models.SyncResponse, error)
}

type syncService struct {
	taskRepo       repositories.TaskRepository
	petRepo        repositories.PetRepository
	decorationRepo repositories.DecorationRepository
}

func NewSyncService(taskRepo repositories.TaskRepository, petRepo repositories.PetRepository, decorationRepo repositories.DecorationRepository) SyncService {
	return &syncService{taskRepo: taskRepo, petRepo: petRepo, decorationRepo: decorationRepo}
}

func (s *syncService) Sync(userID uuid.UUID, lastSyncAt time.Time) (*models.SyncResponse, error) {
	tasks, err := s.taskRepo.FindUpdatedSince(userID, lastSyncAt)
	if err != nil {
		return nil, err
	}

	pet, err := s.petRepo.FindByUserID(userID)
	if err != nil {
		pet = nil
	}

	decorations, err := s.decorationRepo.FindUpdatedSince(userID, lastSyncAt)
	if err != nil {
		return nil, err
	}

	return &models.SyncResponse{
		Tasks:       tasks,
		Pet:         pet,
		Decorations: decorations,
		SyncedAt:    time.Now(),
	}, nil
}

// internal/services/invite_service.go

type InviteService interface {
	CreateInvite(email string) (*models.InviteResponse, error)
	ValidateInvite(token string) (string, error)
}

type inviteService struct {
	jwtSecret string
	appURL    string
}

func NewInviteService(jwtSecret, appURL string) InviteService {
	return &inviteService{jwtSecret: jwtSecret, appURL: appURL}
}

func (s *inviteService) CreateInvite(email string) (*models.InviteResponse, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24 * 7).Unix(),
		"type":  "invite",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	inviteURL := s.appURL + "/invite/" + tokenString
	qrCodeURL := s.appURL + "/api/v1/invite/" + tokenString + "/qr"

	return &models.InviteResponse{
		Token:     tokenString,
		QRCodeURL: qrCodeURL,
		InviteURL: inviteURL,
	}, nil
}

func (s *inviteService) ValidateInvite(token string) (string, error) {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !parsedToken.Valid {
		return "", errors.New("invalid invite token")
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}

	email, ok := claims["email"].(string)
	if !ok {
		return "", errors.New("invalid email in token")
	}

	return email, nil
}

// Utility functions
func clamp(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
