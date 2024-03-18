package database

type Test struct {
	Id            int    `json:"id"`
	YearAndPeriod string `json:"year_and_period"`
	Week          string `json:"week"`
	Subdomain     string `json:"subdomain"`
	Description   string `json:"description"`
	Type          string `json:"type"`
	TypeElse      string `json:"type_else"`
	ResultType    string `json:"result_type"`
	Time          int    `json:"time"`
	TimeElse      string `json:"time_else"`
	Resitable     bool   `json:"resitable"`
	PtaWeight     int    `json:"pta_weight"`
	PodWeight     int    `json:"pod_weight"`
	Tools         []int  `json:"tools"`
}
