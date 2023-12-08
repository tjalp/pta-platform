package database

import (
	"fmt"
	"slices"
)

type MemoryDatabase struct{}

var ptaData = []PtaData{
	{
		Id:     "0",
		Name:   "aardrijkskunde",
		Level:  "6 VWO",
		Cohort: "2021 - 2024",
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
				Retakable:     true,
				Weight:        15,
				Tools:         "1 t/m 4",
			},
		},
	},
}

func (e MemoryDatabase) Start() {
	fmt.Println("Starting Memory database")
}

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
