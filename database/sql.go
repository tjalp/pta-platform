package database

import (
	"context"
	"database/sql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type SqlDatabase struct{}

var db *sql.DB

func (s SqlDatabase) Start() {
	var err error
	db, err = sql.Open("mysql", "user:password@/dbname")
	if err != nil {
		panic(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatal(err)
	}
}

func (s SqlDatabase) Terminate() {
	if err := db.Close(); err != nil {
		log.Fatal(err)
	}
}

func (s SqlDatabase) SavePta(data PtaData) {
	//TODO implement me
	panic("implement me")
}

func (s SqlDatabase) LoadPta(id string) *PtaData {
	//TODO implement me
	panic("implement me")
}

func (s SqlDatabase) DeletePta(id string) bool {
	//TODO implement me
	panic("implement me")
}
