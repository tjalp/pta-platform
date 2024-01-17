package database

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/go-sql-driver/mysql"
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
	fmt.Println("Opening SQL connection...")
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

	fmt.Println("Successfully opened SQL connection")

	stmt, err := db.Prepare(`CREATE TABLE IF NOT EXISTS ptas (
		id UUID PRIMARY KEY,
		name TEXT,
		level TEXT,
		cohort TEXT,
		tools TEXT
	);`)
	defer stmt.Close()
	_, err = stmt.Exec()
	if err != nil {
		return err
	}

	return nil
}

func (s SqlDatabase) Terminate() {
	if err := db.Close(); err != nil {
		fmt.Println(err)
	}
}

func (s SqlDatabase) SavePta(data PtaData) {
	stmt, err := db.Prepare("REPLACE INTO `ptas` (id, name, level, cohort) VALUES (?, ?, ?, ?)")
	defer stmt.Close()
	if err != nil {
		fmt.Println(err)
		return
	}

	stmt.Exec(data.Id, data.Name, data.Level, data.Cohort)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func (s SqlDatabase) LoadPta(id string) *PtaData {
	var pta PtaData

	stmt, err := db.Prepare("SELECT id, name, level, cohort FROM ptas WHERE id=?")
	defer stmt.Close()
	if err != nil {
		fmt.Println(err)
		return nil
	}

	row := stmt.QueryRow(id)
	err = row.Scan(&pta.Id, &pta.Name, &pta.Level, &pta.Cohort)
	if err != nil {
		fmt.Println(err)
		return nil
	}

	return &pta
}

func (s SqlDatabase) DeletePta(id string) bool {
	stmt, err := db.Prepare("DELETE FROM ptas WHERE id=?")
	defer stmt.Close()
	if err != nil {
		fmt.Println(err)
		return false
	}

	exec, err := stmt.Exec(id)
	if err != nil {
		return false
	}

	count, err := exec.RowsAffected()

	return count > 0
}
