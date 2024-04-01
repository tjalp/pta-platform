package router

import (
	"fmt"
	"github.com/golang-jwt/jwt"
	"github.com/tjalp/pta-platform/auth"
	"golang.org/x/crypto/bcrypt"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
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

	// user := database.User{
	// 	Id:        "testId",
	// 	Email:     "test@example.com",
	// 	CreatedAt: time.Unix(0, 0),
	// }
	// if data.FindUsers(map[string]string{"id": "testId"}) == nil {
	// 	fmt.Println("Creating test user")
	// 	data.SaveUser(user)
	// }

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
			users := data.FindUsers(map[string][]string{"google_user_id": {googleId}})
			var user *database.User = nil
			if users != nil {
				user = &users[0]
			}

			if user == nil {
				newUser := database.User{
					GoogleUserId: googleId,
					Email:        payload.Claims["email"].(string),
					CreatedAt:    time.Now(),
				}
				newUser = data.SaveUser(newUser)
				user = &newUser
			}

			c.SetCookie("google-token", token, int(payload.Expires), "/", "", false, false)
			// c.Redirect(http.StatusAccepted, c.Param("next"))
			c.JSON(http.StatusOK, user)
		})

	apiGroup.POST("/auth/signup", func(c *gin.Context) {
		var user database.User
		if err := c.ShouldBind(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if user.Abbreviation == "" || user.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "abbreviation and password may not be empty"})
			return
		}
		existingUser := data.FindUsers(map[string][]string{"abbreviation": {user.Abbreviation}})
		if existingUser != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error hashing password"})
			return
		}
		user.Password = string(hashedPassword)
		user.CreatedAt = time.Now()
		user = data.SaveUser(user)
		c.JSON(http.StatusCreated, user)
	})

	apiGroup.POST("/auth/login", func(c *gin.Context) {
		var user database.User
		if err := c.ShouldBind(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if user.Abbreviation == "" || user.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "abbreviation and password may not be empty"})
			return
		}
		var existingUsers = data.FindUsers(map[string][]string{"abbreviation": {user.Abbreviation}})
		var existingUser *database.User = nil
		if existingUsers != nil {
			existingUser = &existingUsers[0]
		}
		if existingUser == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		err := bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(user.Password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid password"})
			return
		}
		expirationTime := time.Now().Add(time.Hour * 12)
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{ExpiresAt: expirationTime.Unix()})
		tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error generating token"})
			return
		}
		c.SetCookie("token", tokenString, int(expirationTime.Unix()), "/", "", false, false)
		c.JSON(http.StatusOK, gin.H{"message": "login successful"})
	})

	apiGroup.Group("/pta").
		//Use(auth.Auth(data)).
		//Use(auth.Authentication(data)).
		GET("/:id", getPta).
		DELETE("/:id", deletePta).
		POST("/create", createPta).
		PUT("/:id", editPta).
		GET("/:id/export", exportPta).
		GET("/search", func(c *gin.Context) { searchPta(c, false) }).
		GET("/all", func(c *gin.Context) { searchPta(c, true) }).
		POST("/upload", uploadPta)

	apiGroup.Group("/user").
		//Use(auth.Authentication(data)).
		GET("/:id", getUser).
		POST("/create", createUser).
		PUT("/:id", setUser).
		GET("/all", getAllUsers).
		PUT("/password", setPassword)

	apiGroup.Group("/defaults").
		//Use(auth.Authentication(data)).
		GET("/tools", getTools).
		POST("/tools", addTools).
		PUT("/tools", setTools).
		GET("/subjects", getSubjects).
		POST("/subjects", addSubjects).
		PUT("/subjects", setSubjects).
		GET("/types", getTypes).
		POST("/types", addTypes).
		PUT("/types", setTypes).
		GET("/periods", getPeriods).
		PUT("/periods", setPeriods).
		GET("/durations", getDurations).
		POST("/durations", addDurations).
		PUT("/durations", setDurations).
		GET("/cohorts", getCohorts).
		POST("/cohorts", addCohorts).
		PUT("/cohorts", setCohorts)

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

	c.JSON(http.StatusOK, pta)
}

func createPta(c *gin.Context) {
	var pta database.PtaData

	if err := c.ShouldBind(&pta); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if pta.Name == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "'name' cannot be empty"})
		return
	}

	//pta.Id = uuid.NewString()[0:6]

	pta = data.SavePta(pta)

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

	if err := c.ShouldBind(&pta); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	if err := c.ShouldBind(&toolsToAdd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tools := append(data.GetTools(), toolsToAdd...)

	data.SetTools(tools)

	c.JSON(http.StatusOK, tools)
}

func setTools(c *gin.Context) {
	var tools []string

	if err := c.Bind(&tools); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	if err := c.Bind(&subjectsToAdd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subjects := append(data.GetSubjects(), subjectsToAdd...)

	data.SetSubjects(subjects)

	c.JSON(http.StatusOK, subjects)
}

func setSubjects(c *gin.Context) {
	var subjects []database.Subject

	if err := c.Bind(&subjects); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data.SetSubjects(subjects)

	c.JSON(http.StatusOK, subjects)
}

func getUser(c *gin.Context) {
	id := c.Param("id")

	user := data.GetUser(id)

	if user == nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, user)
}

func createUser(c *gin.Context) {
	var user database.User

	if err := c.ShouldBind(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if user.Abbreviation == "" || user.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "'abbreviation' & 'password' cannot be empty"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error hashing password: " + err.Error()})
		return
	}
	user.Password = string(hashedPassword)
	user.CreatedAt = time.Now()

	user = data.SaveUser(user)

	c.JSON(http.StatusCreated, user)
}

func setUser(c *gin.Context) {
	id := c.Param("id")

	user := data.GetUser(id)

	if user == nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	if err := c.ShouldBind(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error hashing password"})
		return
	}
	user.Password = string(hashedPassword)
	if user.CreatedAt.IsZero() {
		user.CreatedAt = time.Now()
	}
	data.SaveUser(*user)

	c.Status(http.StatusNoContent)
}

func getAllUsers(c *gin.Context) {
	c.JSON(http.StatusOK, data.FindUsers(map[string][]string{}))
}

func setPassword(c *gin.Context) {
	password := struct {
		OldPassword string `json:"old_password" form:"old_password"`
		NewPassword string `json:"password" form:"password"`
	}{}

	if err := c.ShouldBind(&password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if password.OldPassword == "" || password.NewPassword == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "'old_password' & 'new_password' cannot be empty"})
		return
	}
	cookie, _ := c.Cookie("token")
	_, claims, err := auth.ValidateToken(cookie) // is authenticated, so this cookie exists
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	tempUser := data.GetUser(claims.Subject)
	if tempUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := *tempUser
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password.OldPassword))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid password"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error hashing password"})
		return
	}

	user.Password = string(hashedPassword)

	data.SaveUser(user)

	c.JSON(http.StatusOK, user)
}

func uploadPta(c *gin.Context) {
	form, err := c.MultipartForm()
	years := form.Value["year"]
	files := form.File["files[]"]

	if err != nil || years == nil || len(years) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "no year provided"})
		return
	}
	yearString := years[0]
	year, err := strconv.Atoi(yearString)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "wrong year provided: " + err.Error()})
		return
	}

	if err != nil || files == nil || len(files) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "no files provided"})
		return
	}
	var wg sync.WaitGroup

	for _, fileHeader := range files {
		wg.Add(1)
		// New function otherwise there may be a resource leak
		go func(fileHeader *multipart.FileHeader) {
			defer wg.Done()
			fmt.Println("Processing file:", fileHeader.Filename)
			file, err := fileHeader.Open()
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "error opening file:" + fileHeader.Filename})
				return
			}
			defer file.Close()
			f, err := excelize.OpenReader(file)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "error reading file:" + fileHeader.Filename})
				return
			}
			sheets := f.GetSheetList()

			for _, sheetName := range sheets {
				wg.Add(1)
				go func(sheetName string) {
					defer wg.Done()
					startTime := time.Now()
					rows, err := f.GetRows(sheetName, excelize.Options{})
					if err != nil {
						fmt.Println("error reading sheet", sheetName, ":", err)
						return
					}
					pta := ReadRows(rows)
					pta.Year = year
					processTime := time.Since(startTime)
					startSavingTime := time.Now()
					data.SavePta(pta)
					saveTime := time.Since(startSavingTime)
					fmt.Printf("Processed sheet %8s (%30s) in %10s and saved in %10s with total time being %10s\n", sheetName, pta.Name, processTime, saveTime, time.Since(startTime))
				}(sheetName)
			}
		}(fileHeader)
	}
	wg.Wait()

	c.JSON(http.StatusOK, gin.H{"message": "files uploaded and processed"})
}

func getTypes(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetTypes())
}

func addTypes(c *gin.Context) {
	var typesToAdd []string

	if err := c.Bind(&typesToAdd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	types := append(data.GetTypes(), typesToAdd...)

	data.SetTypes(types)

	c.JSON(http.StatusOK, types)
}

func setTypes(c *gin.Context) {
	var types []string

	if err := c.Bind(&types); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data.SetTypes(types)

	c.JSON(http.StatusOK, types)
}

func getPeriods(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetPeriods())
}

func setPeriods(c *gin.Context) {
	var periods []database.Period

	if err := c.Bind(&periods); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data.SetPeriods(periods)

	c.JSON(http.StatusOK, periods)
}

func getDurations(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetDurations())
}

func addDurations(c *gin.Context) {
	var durationsToAdd []int

	if err := c.Bind(&durationsToAdd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	durations := append(data.GetDurations(), durationsToAdd...)

	data.SetDurations(durations)

	c.JSON(http.StatusOK, durations)
}

func setDurations(c *gin.Context) {
	var durations []int

	if err := c.Bind(&durations); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data.SetDurations(durations)

	c.JSON(http.StatusOK, durations)
}

func getCohorts(c *gin.Context) {

}

func addCohorts(c *gin.Context) {

}

func setCohorts(c *gin.Context) {

}
