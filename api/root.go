package api

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PtaData struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Level  string `json:"level"`
	Cohort string `json:"cohort"`
	Tests  []Test `json:"tests"`
}

var data = []PtaData{
	{
		Id:     uuid.NewString(),
		Name:   "aardrijkskunde",
		Level:  "6 VWO",
		Cohort: "2021 - 2024",
		Tests: []Test{
			{
				Id:            601,
				YearAndPeriod: "6.1",
				Week:          "SE 1",
				Subdomain:     "A, B1, E1",
				Description:   "Wonen in Nederland H1 t/m H3\nGlobalisering H1 t/m H4",
				Type:          "schriftelijk",
				ResultType:    "cijfer",
				Time:          100,
				Retakable:     true,
				Weight:        15,
				Tools:         "1 t/m 4",
			},
		},
	},
}

func StartServer() {
	fmt.Println("Starting PTA Platform")

	router := gin.Default()
	router.GET("/pta/get", getPta)

	router.POST("/pta/create", createPta)

	router.Run("localhost:8080")
}

func getPta(c *gin.Context) {
	c.JSON(http.StatusOK, data)
}

func createPta(c *gin.Context) {
	name := strings.TrimSpace(c.PostForm("name"))
	level := strings.TrimSpace(c.PostForm("level"))
	cohort := strings.TrimSpace(c.PostForm("cohort"))

	if name == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "'name' cannot be empty"})
		return
	}

	pta := PtaData{
		Id:     uuid.NewString(),
		Name:   name,
		Level:  level,
		Cohort: cohort,
		Tests:  []Test{},
	}

	data = append(data, pta)

	c.JSON(http.StatusCreated, pta)
}
