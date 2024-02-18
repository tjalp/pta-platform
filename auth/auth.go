package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

var tokens []string

func Authentication() gin.HandlerFunc {
	return func(c *gin.Context) {
		authenticate(c)
	}
}

func authenticate(c *gin.Context) {
	bearerToken := c.GetHeader("Authorization")

	if bearerToken == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	reqToken := strings.Split(bearerToken, "Bearer ")[1]

	for _, token := range tokens {
		if token == reqToken {
			continue
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
	}
}

func GenerateToken(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func AddToken(token string) {
	tokens = append(tokens, token)
}
