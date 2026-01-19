// internal/repositories/user_repository.go
package repositories

import (
	"time"

	"guildquest/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id uuid.UUID) (*models.User, error)
	UpdateGold(userID uuid.UUID, gold int) error
	GetGold(userID uuid.UUID) (int, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) UpdateGold(userID uuid.UUID, gold int) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("gold", gold).Error
}

func (r *userRepository) GetGold(userID uuid.UUID) (int, error) {
	var user models.User
	err := r.db.Select("gold").First(&user, "id = ?", userID).Error
	return user.Gold, err
}

// internal/repositories/task_repository.go

type TaskRepository interface {
	Create(task *models.Task) error
	CreateBulk(tasks []models.Task) error
	FindByUserID(userID uuid.UUID) ([]models.Task, error)
	FindByID(id uuid.UUID) (*models.Task, error)
	MarkComplete(id uuid.UUID) error
	Delete(id uuid.UUID) error
	FindUpdatedSince(userID uuid.UUID, since time.Time) ([]models.Task, error)
}

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

func (r *taskRepository) CreateBulk(tasks []models.Task) error {
	return r.db.Create(&tasks).Error
}

func (r *taskRepository) FindByUserID(userID uuid.UUID) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&tasks).Error
	return tasks, err
}

func (r *taskRepository) FindByID(id uuid.UUID) (*models.Task, error) {
	var task models.Task
	err := r.db.First(&task, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) MarkComplete(id uuid.UUID) error {
	return r.db.Model(&models.Task{}).Where("id = ?", id).Update("completed", true).Error
}

func (r *taskRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Task{}, "id = ?", id).Error
}

func (r *taskRepository) FindUpdatedSince(userID uuid.UUID, since time.Time) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Where("user_id = ? AND updated_at > ?", userID, since).Find(&tasks).Error
	return tasks, err
}

// internal/repositories/pet_repository.go

type PetRepository interface {
	Create(pet *models.Pet) error
	FindByUserID(userID uuid.UUID) (*models.Pet, error)
	Update(pet *models.Pet) error
	AddExp(userID uuid.UUID, exp int) error
	UpdateStats(userID uuid.UUID, hunger, happiness int) error
}

type petRepository struct {
	db *gorm.DB
}

func NewPetRepository(db *gorm.DB) PetRepository {
	return &petRepository{db: db}
}

func (r *petRepository) Create(pet *models.Pet) error {
	return r.db.Create(pet).Error
}

func (r *petRepository) FindByUserID(userID uuid.UUID) (*models.Pet, error) {
	var pet models.Pet
	err := r.db.First(&pet, "user_id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return &pet, nil
}

func (r *petRepository) Update(pet *models.Pet) error {
	return r.db.Save(pet).Error
}

func (r *petRepository) AddExp(userID uuid.UUID, exp int) error {
	return r.db.Model(&models.Pet{}).Where("user_id = ?", userID).
		Update("exp", gorm.Expr("exp + ?", exp)).Error
}

func (r *petRepository) UpdateStats(userID uuid.UUID, hunger, happiness int) error {
	return r.db.Model(&models.Pet{}).Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"hunger":    hunger,
			"happiness": happiness,
		}).Error
}

// internal/repositories/decoration_repository.go

type DecorationRepository interface {
	Create(decoration *models.Decoration) error
	FindByUserID(userID uuid.UUID) ([]models.Decoration, error)
	Exists(userID uuid.UUID, decoration string) (bool, error)
	FindUpdatedSince(userID uuid.UUID, since time.Time) ([]models.Decoration, error)
}

type decorationRepository struct {
	db *gorm.DB
}

func NewDecorationRepository(db *gorm.DB) DecorationRepository {
	return &decorationRepository{db: db}
}

func (r *decorationRepository) Create(decoration *models.Decoration) error {
	return r.db.Create(decoration).Error
}

func (r *decorationRepository) FindByUserID(userID uuid.UUID) ([]models.Decoration, error) {
	var decorations []models.Decoration
	err := r.db.Where("user_id = ?", userID).Find(&decorations).Error
	return decorations, err
}

func (r *decorationRepository) Exists(userID uuid.UUID, decoration string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Decoration{}).
		Where("user_id = ? AND decoration = ?", userID, decoration).
		Count(&count).Error
	return count > 0, err
}

func (r *decorationRepository) FindUpdatedSince(userID uuid.UUID, since time.Time) ([]models.Decoration, error) {
	var decorations []models.Decoration
	err := r.db.Where("user_id = ? AND created_at > ?", userID, since).Find(&decorations).Error
	return decorations, err
}
