package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	ID                 int64    `json:"id"`
	FullName           string   `json:"full_name"`
	Email              string   `json:"email"`
	Roles              []string `json:"roles"`
	MustChangePassword bool     `json:"must_change_password"`
}

type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

const refreshTokenLifetime = 30 * 24 * time.Hour

func generateRefreshToken() (string, error) {
	randomBytes := make([]byte, 32)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(randomBytes), nil
}

func hashRefreshToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// Login authenticates an active user and creates a session.
func Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	if strings.TrimSpace(req.Email) == "" || req.Password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	var user User
	var passwordHash string

	err := database.DB.QueryRow(ctx, `
		SELECT id, full_name, email, password_hash, must_change_password
		FROM users
		WHERE LOWER(email) = LOWER($1)
		AND active = TRUE
	`, strings.TrimSpace(req.Email)).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&passwordHash,
		&user.MustChangePassword,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("invalid email or password")
		}
		return nil, fmt.Errorf("authentication failed")
	}

	valid, err := VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		return nil, fmt.Errorf("invalid email or password")
	}

	rows, err := database.DB.Query(ctx, `
		SELECT r.name
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY r.id
	`, user.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve user roles")
	}
	defer rows.Close()

	user.Roles = []string{}

	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, fmt.Errorf("failed to read user roles")
		}
		user.Roles = append(user.Roles, role)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read user roles")
	}

	if len(user.Roles) == 0 {
		return nil, fmt.Errorf("account has no assigned roles")
	}

	sessionID := uuid.New()

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to create session")
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create session")
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO auth_sessions (
			id, user_id, refresh_token_hash, expires_at
		)
		VALUES ($1, $2, $3, $4)
	`, sessionID, user.ID, hashRefreshToken(refreshToken),
		time.Now().Add(refreshTokenLifetime))

	if err != nil {
		return nil, fmt.Errorf("failed to create session")
	}

	_, err = tx.Exec(ctx, `
		UPDATE users
		SET last_login_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, user.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to update login time")
	}

	accessToken, err := GenerateAccessToken(
		user.ID,
		sessionID.String(),
		user.Roles,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to save session")
	}

	return &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    900,
	}, nil
}

// RefreshSession rotates a refresh token and issues a new access token.
func RefreshSession(ctx context.Context, oldRefreshToken string) (*RefreshResponse, error) {
	if oldRefreshToken == "" {
		return nil, fmt.Errorf("refresh token is required")
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh session")
	}
	defer tx.Rollback(ctx)

	var sessionID uuid.UUID
	var userID int64
	var expiresAt time.Time

	err = tx.QueryRow(ctx, `
		SELECT s.id, s.user_id, s.expires_at
		FROM auth_sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.refresh_token_hash = $1
		AND s.revoked_at IS NULL
		AND s.expires_at > CURRENT_TIMESTAMP
		AND u.active = TRUE
		FOR UPDATE OF s
	`, hashRefreshToken(oldRefreshToken)).Scan(
		&sessionID,
		&userID,
		&expiresAt,
	)

	if err != nil {
		return nil, fmt.Errorf("invalid or expired refresh token")
	}

	rows, err := tx.Query(ctx, `
		SELECT r.name
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY r.id
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve user roles")
	}

	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			rows.Close()
			return nil, fmt.Errorf("failed to read user roles")
		}
		roles = append(roles, role)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("failed to read user roles")
	}
	rows.Close()

	if len(roles) == 0 {
		return nil, fmt.Errorf("account has no assigned roles")
	}

	newRefreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to rotate refresh token")
	}

	_, err = tx.Exec(ctx, `
		UPDATE auth_sessions
		SET refresh_token_hash = $1,
		    expires_at = $2,
		    last_used_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`, hashRefreshToken(newRefreshToken),
		time.Now().Add(refreshTokenLifetime),
		sessionID)

	if err != nil {
		return nil, fmt.Errorf("failed to rotate refresh token")
	}

	accessToken, err := GenerateAccessToken(
		userID,
		sessionID.String(),
		roles,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to save refreshed session")
	}

	return &RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    900,
	}, nil
}

// Logout revokes the current session.
func Logout(ctx context.Context, sessionID string, userID int64) error {
	id, err := uuid.Parse(sessionID)
	if err != nil {
		return fmt.Errorf("invalid session")
	}

	result, err := database.DB.Exec(ctx, `
		UPDATE auth_sessions
		SET revoked_at = CURRENT_TIMESTAMP
		WHERE id = $1
		AND user_id = $2
		AND revoked_at IS NULL
	`, id, userID)

	if err != nil {
		return fmt.Errorf("failed to revoke session")
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("session not found or already revoked")
	}

	return nil
}
