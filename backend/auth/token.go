package auth

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	SessionID string   `json:"sid"`
	Roles     []string `json:"roles"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(
	userID int64,
	sessionID string,
	roles []string,
) (string, error) {
	secret := os.Getenv("JWT_ACCESS_SECRET")

	if len(secret) < 32 {
		return "", fmt.Errorf("JWT_ACCESS_SECRET must contain at least 32 characters")
	}

	expiryMinutes := 15
	if value := os.Getenv("JWT_ACCESS_EXPIRY_MINUTES"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 5 || parsed > 60 {
			return "", fmt.Errorf("JWT_ACCESS_EXPIRY_MINUTES must be between 5 and 60")
		}
		expiryMinutes = parsed
	}

	now := time.Now()

	claims := Claims{
		SessionID: sessionID,
		Roles:     roles,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(userID, 10),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expiryMinutes) * time.Minute)),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "labsync",
			Audience:  jwt.ClaimStrings{"labsync-mobile"},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func ValidateAccessToken(tokenString string) (*Claims, error) {
	secret := os.Getenv("JWT_ACCESS_SECRET")

	if len(secret) < 32 {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET must contain at least 32 characters")
	}

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, fmt.Errorf("unexpected signing algorithm")
			}
			return []byte(secret), nil
		},
		jwt.WithIssuer("labsync"),
		jwt.WithAudience("labsync-mobile"),
		jwt.WithExpirationRequired(),
		jwt.WithLeeway(30*time.Second),
	)

	if err != nil {
		return nil, fmt.Errorf("invalid access token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid access token")
	}

	if claims.Subject == "" || claims.SessionID == "" {
		return nil, fmt.Errorf("missing token identity")
	}

	if _, err := strconv.ParseInt(claims.Subject, 10, 64); err != nil {
		return nil, fmt.Errorf("invalid user identity")
	}

	return claims, nil
}
