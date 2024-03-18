package database

import (
	"fmt"
	"reflect"
	"slices"
)

type MemoryDatabase struct{}

var ptaData = []PtaData{
	{
		Id:     "0",
		Name:   "aardrijkskunde",
		Level:  "6 VWO",
		Cohort: "2021 - 2024",
		Tools: []string{
			"pen (blauw of zwart), potlood, geodriehoek/lineaal",
			"rekenmachine (niet grafisch)",
			"De Grote Bosatlas 55e druk",
			"aanvullend katern bij GB 55e druk",
		},
		Tests: []Test{
			{
				Id:            601,
				YearAndPeriod: "6.1",
				Week:          "SE 1",
				Subdomain:     "A, B1, E1",
				Description:   "Wonen in Nederland H1 t/m H3\nGlobalisering H1 t/m H4",
				Type:          "schriftelijk",
				ResultType:    "cijfer",
				Time:          100,
				Resitable:     true,
				PtaWeight:     15,
				Tools:         []int{0, 1, 2, 3},
			},
		},
	},
}

func (e MemoryDatabase) Start() error {
	fmt.Println("Starting Memory database")
	return nil
}

func (e MemoryDatabase) Terminate() {}

func (e MemoryDatabase) SavePta(pta PtaData) {
	ptaData = append(ptaData, pta)
}

func (e MemoryDatabase) LoadPta(id string) *PtaData {
	idx := slices.IndexFunc(ptaData, func(pd PtaData) bool { return pd.Id == id })

	if idx == -1 {
		return nil
	}

	return &ptaData[idx]
}

func (e MemoryDatabase) DeletePta(id string) bool {
	idx := slices.IndexFunc(ptaData, func(pd PtaData) bool { return pd.Id == id })

	if idx == -1 {
		return false
	}

	slices.Delete(ptaData, idx, idx+1)

	return true
}

func (e MemoryDatabase) SearchPta(query map[string][]string) []PtaData {
	var results []PtaData

	for _, item := range ptaData {
		if itemMatchesQuery(item, query) {
			results = append(results, item)
		}
	}

	return results
}

func itemMatchesQuery(pta PtaData, query map[string][]string) bool {
	for key, values := range query {
		field := reflect.ValueOf(pta).FieldByName(key)
		if !field.IsValid() {
			// Field not found in struct
			return false
		}
		fieldValue := fmt.Sprintf("%v", field.Interface())
		if !contains(values, fieldValue) {
			return false
		}
	}
	return true
}

func contains(arr []string, val string) bool {
	for _, item := range arr {
		if item == val {
			return true
		}
	}
	return false
}
