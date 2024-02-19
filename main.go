package main

import (
	_ "github.com/joho/godotenv/autoload"
	"github.com/tjalp/pta-platform/router"
)

func main() {
	router.StartServer()
}
