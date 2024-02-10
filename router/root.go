package router

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/database"
	"github.com/tjalp/pta-platform/export/pdf"
	"net/http"
	"strings"
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
	router.Group("/api").
		GET("/pta/:id", getPta).
		DELETE("/pta/:id", deletePta).
		POST("/pta/create", createPta).
		PUT("/pta/:id", editPta).
		GET("/pta/:id/export", exportPta).
		GET("/pta/search", func(c *gin.Context) { searchPta(c, false) }).
		GET("/pta/all", func(c *gin.Context) { searchPta(c, true) })

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
