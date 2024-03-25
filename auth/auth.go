package auth

import (
	"crypto/rand"
	"encoding/hex"
	"github.com/golang-jwt/jwt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tjalp/pta-platform/database"
	"google.golang.org/api/idtoken"
)

var tokens []string

func Authentication(db database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		Authenticate(c, db)

		c.Next()
	}
}

func Authenticate(c *gin.Context, db database.Database) bool {
	reqToken := getToken(c)
	payload, err := idtoken.Validate(c, reqToken, "")

	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return false
	}

	googleId := payload.Subject
	user := db.FindUsers(map[string][]string{"google_user_id": {googleId}})

	if user == nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return false
	}

	c.Header("Authorization", "Bearer "+reqToken)

	return true
}

func getToken(c *gin.Context) string {
	bearerToken := c.GetHeader("Authorization")
	split := strings.Split(bearerToken, "Bearer ")

	if bearerToken == "" || len(split) < 2 {
		token, err := c.Cookie("google-token")
		if err != nil {
			return ""
		}
		return token
	}

	return split[1]
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

func Auth(db database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("token")
		if err != nil {
			//c.Header("WWW-Authenticate", "Basic realm=Authorization Required")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		_, _, err = ValidateToken(cookie)
		if err != nil {
			//c.Header("WWW-Authenticate", "Basic realm=Authorization Required")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		c.Next()
	}
}

func ValidateToken(tokenString string) (*jwt.Token, *jwt.StandardClaims, error) {
	claims := &jwt.StandardClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil {
		return nil, nil, err
	}
	return token, claims, nil
}
