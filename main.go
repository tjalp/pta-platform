package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type pta struct {
	Id    string `json:"id"`
	Title string `json:"title"`
}

var ptas = []pta{
	{Id: "1", Title: "Title"},
}

func main() {
	fmt.Println("Starting PTA Platform")

	router := gin.Default()
	router.GET("/getPTAs", getPTAs)

	router.Run("localhost:8080")
}

func getPTAs(c *gin.Context) {
	c.JSON(http.StatusOK, ptas)
}
