package router

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/auth"
	"github.com/tjalp/pta-platform/database"
	"github.com/tjalp/pta-platform/export/pdf"
	"github.com/xuri/excelize/v2"
	"google.golang.org/api/idtoken"
)

var data database.Database

func StartServer() {
	fmt.Println("Starting PTA Platform")

	data = database.MongoDatabase{}
	err := data.Start()
	defer data.Terminate()
	if err != nil {
		panic(err)
		return
	}

	gin.SetMode(gin.ReleaseMode)

	user := database.User{
		Id:        "testId",
		Email:     "test@example.com",
		CreatedAt: time.Unix(0, 0),
	}
	if data.FindUser(map[string]string{"id": "testId"}) == nil {
		fmt.Println("Creating test user")
		data.SaveUser(user)
	}

	router := gin.Default()
	router.Use(cors.Default())
	router.Use(static.Serve("/", static.LocalFile("assets", false)))
	//router.Use(static.ServeRoot("/", "./assets"))
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "endpoint not found"})
			return
		}
		c.File("./assets/404.html")
	})
	apiGroup := router.Group("/api")

	apiGroup.Group("/auth").
		POST("/google", func(c *gin.Context) {
			bearerToken := c.GetHeader("Authorization")
			token := strings.Split(bearerToken, "Bearer ")[1]
			payload, err := idtoken.Validate(c, token, "")
			if err != nil {
				fmt.Println("Error validating token: ", err)
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}
			googleId := payload.Subject
			user := data.FindUser(map[string]string{"google_user_id": googleId})

			if user == nil {
				newUser := database.User{
					Id:           uuid.NewString(),
					GoogleUserId: googleId,
					Email:        payload.Claims["email"].(string),
					CreatedAt:    time.Now(),
				}
				data.SaveUser(newUser)
				user = &newUser
			}

			c.SetCookie("google-token", token, int(payload.Expires), "/", "", false, false)
			// c.Redirect(http.StatusAccepted, c.Param("next"))
			c.JSON(http.StatusOK, user)
		})

	apiGroup.Group("/pta").
		Use(auth.Authentication(data)).
		GET("/:id", getPta).
		DELETE("/:id", deletePta).
		POST("/create", createPta).
		PUT("/:id", editPta).
		GET("/:id/export", exportPta).
		GET("/search", func(c *gin.Context) { searchPta(c, false) }).
		GET("/all", func(c *gin.Context) { searchPta(c, true) }).
		POST("/upload", uploadPta)

	apiGroup.Group("/defaults").
		Use(auth.Authentication(data)).
		GET("/tools", getTools).
		POST("/tools", addTools).
		PUT("/tools", setTools).
		GET("/subjects", getSubjects).
		POST("/subjects", addSubjects).
		PUT("/subjects", setSubjects)

	err = router.Run()
	if err != nil {
		panic(err)
	}
}

func getPta(c *gin.Context) {
	id := c.Param("id")

	pta := data.LoadPta(id)

	if pta == nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, data.LoadPta(id))
}

func createPta(c *gin.Context) {
	var pta database.PtaData

	if err := c.Bind(&pta); err != nil {
		panic(err)
		return
	}

	if pta.Name == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "'name' cannot be empty"})
		return
	}

	pta.Id = uuid.NewString()[0:6]

	data.SavePta(pta)

	c.JSON(http.StatusCreated, pta)
}

func deletePta(c *gin.Context) {
	id := c.Param("id")

	deleted := data.DeletePta(id)

	if !deleted {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.Status(http.StatusOK)
}

func editPta(c *gin.Context) {
	id := c.Param("id")

	pta := data.LoadPta(id)

	if pta == nil {
		createPta(c)
		return
	}

	if err := c.Bind(&pta); err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	data.SavePta(*pta)

	c.Status(http.StatusNoContent)
}

func exportPta(c *gin.Context) {
	id := c.Param("id")

	pta := data.LoadPta(id)

	if pta == nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	err := pdf.Exporter{}.Export(c, *pta)
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, pta)
}

func searchPta(c *gin.Context, allowNoParams bool) {
	params := c.Request.URL.Query()

	if !allowNoParams {
		if params == nil || len(params) == 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "no search parameters provided"})
			return
		}
	}

	result := data.SearchPta(params)

	if result == nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func getTools(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetTools())
}

func addTools(c *gin.Context) {
	var toolsToAdd []string

	err := c.Bind(&toolsToAdd)

	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	tools := append(data.GetTools(), toolsToAdd...)

	data.SetTools(tools)

	c.JSON(http.StatusOK, tools)
}

func setTools(c *gin.Context) {
	var tools []string

	err := c.Bind(&tools)

	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	data.SetTools(tools)

	c.JSON(http.StatusOK, tools)
}

func getSubjects(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetSubjects())
}

func addSubjects(c *gin.Context) {
	var subjectsToAdd []database.Subject

	err := c.Bind(&subjectsToAdd)

	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	subjects := append(data.GetSubjects(), subjectsToAdd...)

	data.SetSubjects(subjects)

	c.JSON(http.StatusOK, subjects)
}

func setSubjects(c *gin.Context) {
	var subjects []database.Subject

	err := c.Bind(&subjects)

	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	data.SetSubjects(subjects)

	c.JSON(http.StatusOK, subjects)
}

func uploadPta(c *gin.Context) {
	fileHeader, err := c.FormFile("file")

	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "error opening file"})
		return
	}
	defer file.Close()
	f, err := excelize.OpenReader(file)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "error reading file"})
		return
	}
	sheets := f.GetSheetList()

	for _, sheetName := range sheets {
		rows, err := f.GetRows(sheetName, excelize.Options{})
		if err != nil {
			fmt.Println("error reading sheet", sheetName, ":", err)
			continue
		}
		pta := ReadRows(rows)
		data.SavePta(pta)
	}

	c.JSON(http.StatusOK, gin.H{"message": "file uploaded"})
}
