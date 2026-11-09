package auth

import (
	"context"
	"fmt"
	"strconv"

	"labsync/backend/database"

	"github.com/google/uuid"
)

// ValidateSession verifies that a JWT's session still exists and is active.
// This must be called by authentication middleware on protected requests.
func ValidateSession(ctx context.Context, claims *Claims) (int64, error) {
	if claims == nil {
		return 0, fmt.Errorf("missing authentication claims")
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid user identity")
	}

	sessionID, err := uuid.Parse(claims.SessionID)
	if err != nil {
		return 0, fmt.Errorf("invalid session identity")
	}

	var active bool

	err = database.DB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM auth_sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.id = $1
			AND s.user_id = $2
			AND s.revoked_at IS NULL
			AND s.expires_at > CURRENT_TIMESTAMP
			AND u.active = TRUE
		)
	`, sessionID, userID).Scan(&active)

	if err != nil {
		return 0, fmt.Errorf("failed to validate session")
	}

	if !active {
		return 0, fmt.Errorf("session is no longer active")
	}

	return userID, nil
}
