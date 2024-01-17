package router

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/database"
	"net/http"
)

var data database.Database

func StartServer() {
	fmt.Println("Starting PTA Platform")

	data = database.SqlDatabase{}
	err := data.Start()
	if err != nil {
		panic(err)
		return
	}

	gin.SetMode(gin.ReleaseMode)

	router := gin.Default()
	router.GET("/pta/:id", getPta)
	router.DELETE("/pta/:id", deletePta)
	router.POST("/pta/create", createPta)
	router.PUT("/pta/:id", editPta)

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

	pta = database.PtaData{}
	pta.Id = uuid.NewString()

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
