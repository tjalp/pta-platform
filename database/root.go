package database

import "time"

type Database interface {
	Start() error
	Terminate()
	SavePta(PtaData)
	LoadPta(id string) *PtaData
	DeletePta(id string) bool
	SearchPta(map[string][]string) []PtaData
	GetTools() []string
	SetTools([]string)
	GetSubjects() []Subject
	SetSubjects([]Subject)
	FindUser(User) *User
	SaveUser(User)
}

type PtaData struct {
	Id          string   `json:"id" form:"id"`
	Name        string   `json:"name" form:"name"`
	Level       string   `json:"level" form:"level"`
	Cohort      string   `json:"cohort" form:"cohort"`
	Responsible string   `json:"responsible" form:"responsible"`
	Tools       []string `json:"tools" form:"tools"`
	Tests       []Test   `json:"tests" form:"tests"`
}

type Subject struct {
	Name  string `json:"name" form:"name"`
	Level string `json:"level" form:"level"`
}

type User struct {
	Id        string    `json:"id" form:"id"`
	Email     string    `json:"email" form:"email"`
	CreatedAt time.Time `json:"created_at" form:"created_at"`
}
