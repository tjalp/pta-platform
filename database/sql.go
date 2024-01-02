package database

import (
	"context"
	"database/sql"
	"github.com/go-sql-driver/mysql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type SqlDatabase struct{}

var db *sql.DB

func (s SqlDatabase) Start() error {
	cfg := mysql.Config{
		User:                 "root",
		Passwd:               "root",
		Net:                  "tcp",
		Addr:                 "127.0.0.1:3306",
		DBName:               "pta-platform",
		AllowNativePasswords: true,
	} // TODO credentials
	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		return err
	}
	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return err
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS ptas (
		id TEXT,
		name TEXT,
		level TEXT,
		cohort TEXT
	);`)
	if err != nil {
		return err
	}

	return nil
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
