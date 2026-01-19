// internal/models/models.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a registered user
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Email        string    `gorm:"unique;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Gold         int       `gorm:"default:0" json:"gold"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Task represents a quest/task
type Task struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Reward      int       `gorm:"default:10" json:"reward"`
	Completed   bool      `gorm:"default:false" json:"completed"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (t *Task) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// Pet represents the user's virtual pet
type Pet struct {
	UserID    uuid.UUID `gorm:"type:uuid;primary_key" json:"userId"`
	Type      string    `gorm:"default:'dragon'" json:"type"`
	Level     int       `gorm:"default:1" json:"level"`
	Exp       int       `gorm:"default:0" json:"exp"`
	Hunger    int       `gorm:"default:100" json:"hunger"`
	Happiness int       `gorm:"default:100" json:"happiness"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Decoration represents purchased decorations
type Decoration struct {
	UserID     uuid.UUID `gorm:"type:uuid;primaryKey" json:"userId"`
	Decoration string    `gorm:"primaryKey" json:"decoration"`
	CreatedAt  time.Time `json:"createdAt"`
}

// DTO Models for API requests/responses

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	User         User   `json:"user"`
}

type CreateTaskRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Reward      int    `json:"reward" binding:"min=1"`
}

type BulkTaskRequest struct {
	Tasks []CreateTaskRequest `json:"tasks" binding:"required,min=1"`
}

type BuyDecorationRequest struct {
	Decoration string `json:"decoration" binding:"required"`
}

type SyncRequest struct {
	LastSyncAt time.Time `json:"lastSyncAt"`
}

type SyncResponse struct {
	Tasks       []Task       `json:"tasks"`
	Pet         *Pet         `json:"pet"`
	Decorations []Decoration `json:"decorations"`
	User        *User        `json:"user"`
	SyncedAt    time.Time    `json:"syncedAt"`
}

type ErrorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code"`
}

type InviteRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type InviteResponse struct {
	Token     string `json:"token"`
	QRCodeURL string `json:"qrCodeUrl"`
	InviteURL string `json:"inviteUrl"`
}
