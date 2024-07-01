package database

import "time"

type Database interface {
	Start() error
	Terminate()
	SavePta(PtaData) PtaData
	LoadPta(id string) *PtaData
	DeletePta(id string) bool
	SearchPta(map[string][]string) []PtaData
	GetTools() []string
	SetTools([]string)
	GetSubjects() []Subject
	SetSubjects([]Subject)
	GetTypes() []string
	SetTypes([]string)
	GetDurations() []int
	SetDurations([]int)
	GetPeriods() []Period
	SetPeriods([]Period)
	GetUser(string) *User
	FindUsers(map[string][]string) []User
	SaveUser(User) User
	GetConfig() *Config
	SetConfig(Config)
}

type PtaData struct {
	Id          string   `json:"id" form:"id" bson:"_id,omitempty"`
	Name        string   `json:"name" form:"name"`
	Level       string   `json:"level" form:"level"`
	Cohort      string   `json:"cohort" form:"cohort"`
	Year        int      `json:"year" form:"year"` // The first year, so 2024 would be 2024-2025
	Responsible string   `json:"responsible" form:"responsible"`
	Finished    bool     `json:"finished" form:"finished"` // Whether the PTA is finished or not
	Tools       []string `json:"tools" form:"tools"`
	Tests       []Test   `json:"tests" form:"tests"`
	Weights     []int    `json:"weights" form:"weights"`
}

type Subject struct {
	Name        string `json:"name" form:"name"`
	Level       string `json:"level" form:"level"`
	Responsible string `json:"responsible" form:"responsible"`
}

type Period struct {
	StartWeek int `json:"start_week" form:"start_week"`
	EndWeek   int `json:"end_week" form:"end_week"`
}

type User struct {
	Id           string    `json:"id" form:"id" bson:"_id,omitempty"`
	Email        string    `json:"email" form:"email"`
	CreatedAt    time.Time `json:"created_at" form:"created_at" bson:"created_at"`
	GoogleUserId string    `json:"google_user_id" form:"google_user_id" bson:"google_user_id"`
	Abbreviation string    `json:"abbreviation" form:"abbreviation"`
	Password     string    `json:"password,omitempty" form:"password"` // TODO DONT SEND THIS AS RESPONSE!!!
}

type Config struct {
	Locked bool `json:"locked" form:"locked"`
}
