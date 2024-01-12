package database

type Database interface {
	Start() error
	Terminate()
	SavePta(PtaData)
	LoadPta(id string) *PtaData
	DeletePta(id string) bool
}

type PtaData struct {
	Id     string   `json:"id"`
	Name   string   `json:"name"`
	Level  string   `json:"level"`
	Cohort string   `json:"cohort"`
	Tools  []string `json:"tools"`
	Tests  []Test   `json:"tests"`
}
