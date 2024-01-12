package router

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/database"
)

var data database.Database

func StartServer() {
	fmt.Println("Starting PTA Platform")

	data = database.MemoryDatabase{}
	err := data.Start()
	if err != nil {
		log.Fatal(err)
		return
	}

	gin.SetMode(gin.ReleaseMode)

	router := gin.Default()
	router.GET("/pta/:id", getPta)
	router.DELETE("/pta/:id", deletePta)
	router.POST("/pta/create", createPta)

	err = router.Run()
	if err != nil {
		log.Fatal(err)
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
	name := strings.TrimSpace(c.PostForm("name"))
	level := strings.TrimSpace(c.PostForm("level"))
	cohort := strings.TrimSpace(c.PostForm("cohort"))

	if name == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "'name' cannot be empty"})
		return
	}

	pta := database.PtaData{
		Id:     uuid.NewString(),
		Name:   name,
		Level:  level,
		Cohort: cohort,
		Tests:  []database.Test{},
	}

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
