package database

type Database interface {
	Start() error
	Terminate()
	SavePta(PtaData)
	LoadPta(id string) *PtaData
	DeletePta(id string) bool
	SearchPta(map[string][]string) []PtaData
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
