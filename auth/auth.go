package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tjalp/pta-platform/database"
	"google.golang.org/api/idtoken"
)

var tokens []string

func Authentication(db database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		Authenticate(c, db)
	}
}

func Authenticate(c *gin.Context, db database.Database) bool {
	bearerToken := c.GetHeader("Authorization")

	if bearerToken == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return false
	}

	reqToken := strings.Split(bearerToken, "Bearer ")[1]

	payload, err := idtoken.Validate(c, reqToken, "")

	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return false
	}

	googleId := payload.Subject
	user := db.FindUser(map[string]string{"google_user_id": googleId})

	if user == nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return false
	}

	return true
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
