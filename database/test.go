package database

type Test struct {
	Id            int    `json:"id"`
	YearAndPeriod string `json:"year_and_period"`
	Week          string `json:"week"`
	Subdomain     string `json:"subdomain"`
	Description   string `json:"description"`
	Type          string `json:"type"`
	ResultType    string `json:"result_type"`
	Time          int    `json:"time"`
	Resitable     bool   `json:"resitable"`
	Weight        int    `json:"weight"`
	Tools         []int  `json:"tools"`
}
