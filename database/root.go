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
	GetPeriods() []Period
	SetPeriods([]Period)
	GetUser(string) *User
	FindUser(map[string][]string) *User
	SaveUser(User) User
}

type PtaData struct {
	Id          string   `json:"id" form:"id" bson:"_id,omitempty"`
	Name        string   `json:"name" form:"name"`
	Level       string   `json:"level" form:"level"`
	Cohort      string   `json:"cohort" form:"cohort"`
	Responsible string   `json:"responsible" form:"responsible"`
	Tools       []string `json:"tools" form:"tools"`
	Tests       []Test   `json:"tests" form:"tests"`
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
}
