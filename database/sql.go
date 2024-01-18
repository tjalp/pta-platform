package database

import (
	"encoding/json"
	"fmt"
	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

type SqlDatabase struct{}

var sqldb *sqlx.DB

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
	sqldb, err = sqlx.Connect("mysql", cfg.FormatDSN())
	if err != nil {
		return err
	}
	//sqldb.SetConnMaxLifetime(time.Minute * 3)
	//sqldb.SetMaxOpenConns(10)
	//sqldb.SetMaxIdleConns(10)
	//err = sqldb.Ping()
	//if err != nil {
	//	return err
	//}

	fmt.Println("Successfully opened SQL connection")

	//stmt, err := sqldb.Prepare(`CREATE TABLE IF NOT EXISTS ptas (
	//	id UUID NOT NULL PRIMARY KEY,
	//	name TEXT,
	//	level TEXT,
	//	cohort TEXT,
	//	tools JSON,
	//	tests JSON
	//);`)
	//defer stmt.Close()
	//_, err = stmt.Exec()
	//if err != nil {
	//	return err
	//}

	// idk
	_, err = sqldb.Exec(`CREATE TABLE IF NOT EXISTS ptas (
		id UUID NOT NULL PRIMARY KEY,
		name TEXT,
		level TEXT,
		cohort TEXT,
		tools INT,
		tests INT,
		FOREIGN KEY (tools) REFERENCES tools(id),
		FOREIGN KEY (tests) REFERENCES tests(id)
	);`)

	if err != nil {
		return err
	}

	_, err = sqldb.Exec(`CREATE TABLE IF NOT EXISTS tools (
    	id INT AUTO_INCREMENT PRIMARY KEY,
    	tool TEXT
	)`)

	if err != nil {
		return err
	}

	return nil
}

func (s SqlDatabase) Terminate() {
	if err := sqldb.Close(); err != nil {
		fmt.Println(err)
	}
}

func (s SqlDatabase) SavePta(data PtaData) {
	stmt, err := sqldb.Prepare("REPLACE INTO `ptas` (id, name, level, cohort, tools, tests) VALUES (?, ?, ?, ?, ?, ?)")
	defer stmt.Close()
	if err != nil {
		fmt.Println(err)
		return
	}

	jsonTools, _ := json.Marshal(data.Tools)
	jsonTests, _ := json.Marshal(data.Tests)

	stmt.Exec(data.Id, data.Name, data.Level, data.Cohort, jsonTools, jsonTests)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func (s SqlDatabase) LoadPta(id string) *PtaData {
	var pta PtaData

	err := sqldb.Get(&pta, "SELECT * FROM `ptas` WHERE id=? LIMIT 1", id)

	if err != nil {
		fmt.Println(err)
		return nil
	}

	return &pta
}

func (s SqlDatabase) DeletePta(id string) bool {
	stmt, err := sqldb.Prepare("DELETE FROM ptas WHERE id=?")
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
