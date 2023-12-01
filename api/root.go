package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
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
		Id:     "1",
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
	router.GET("/getPtaData", getPtaData)

	router.Run("localhost:8080")
}

func getPtaData(c *gin.Context) {
	c.JSON(http.StatusOK, data)
}
