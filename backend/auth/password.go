package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonTime    uint32 = 3
	argonMemory  uint32 = 64 * 1024
	argonThreads uint8  = 2
	argonKeyLen  uint32 = 32
	saltLength          = 16
)

// HashPassword hashes a password using Argon2id.
func HashPassword(password string) (string, error) {
	if len(password) < 12 {
		return "", fmt.Errorf("password must contain at least 12 characters")
	}

	salt := make([]byte, saltLength)

	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate password salt: %w", err)
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argonTime,
		argonMemory,
		argonThreads,
		argonKeyLen,
	)

	encodedSalt := base64.RawStdEncoding.EncodeToString(salt)
	encodedHash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argonMemory,
		argonTime,
		argonThreads,
		encodedSalt,
		encodedHash,
	), nil
}

// VerifyPassword compares a password with its stored Argon2id hash.
func VerifyPassword(password, encodedHash string) (bool, error) {
	parts := strings.Split(encodedHash, "$")

	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return false, fmt.Errorf("invalid password hash format")
	}

	var memory uint32
	var iterations uint32
	var parallelism uint64

	if _, err := fmt.Sscanf(
		parts[3],
		"m=%d,t=%d,p=%d",
		&memory,
		&iterations,
		&parallelism,
	); err != nil {
		return false, fmt.Errorf("invalid Argon2 parameters")
	}

	// Reject unreasonable parameters before allocating memory.
	if memory < 8*1024 || memory > 256*1024 ||
		iterations < 1 || iterations > 10 ||
		parallelism < 1 || parallelism > 8 {
		return false, fmt.Errorf("Argon2 parameters outside allowed limits")
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("invalid password salt")
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("invalid password hash")
	}

	if len(salt) < 8 || len(salt) > 64 ||
		len(expectedHash) < 16 || len(expectedHash) > 64 {
		return false, fmt.Errorf("invalid password hash dimensions")
	}

	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		iterations,
		memory,
		uint8(parallelism),
		uint32(len(expectedHash)),
	)

	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1, nil
}
