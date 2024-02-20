package router

import (
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/database"
)

func ReadRows(rows [][]string) database.PtaData {
	pta := database.PtaData{}
	pta.Id = uuid.NewString()[0:6]
	pta.Name = rows[0][0]

	toolsIndexStart := 0
	testsIndexStart := 0

	for rowIndex, row := range rows {
		for index, cell := range row {
			if cell == "Jaarlaag:" {
				level, ok := firstMatchAfterIndex(row, index+1, func(cell string) bool {
					return cell != "" && cell != row[index]
				})
				if ok {
					pta.Level = level
				}
			}
			if cell == "Cohort:" {
				cohort, ok := firstMatchAfterIndex(row, index+1, func(cell string) bool {
					return cell != "" && cell != row[index]
				})
				if ok {
					pta.Cohort = cohort
				}
			}
			if cell == "afkorting verantwoordelijke:" {
				responsible, ok := firstMatchAfterIndex(row, index+1, func(cell string) bool {
					return cell != "" && cell != row[index]
				})
				if ok {
					pta.Responsible = responsible
				}
			}
			if cell == "HULPMIDDELEN" {
				toolsIndexStart = rowIndex + 1
				pta.Tools = rows[rowIndex+1][index:]
			}
			if cell == "toetsnummer" {
				testsIndexStart = rowIndex + 2
			}
		}
	}

	tools := []string{}
	for i := toolsIndexStart; i < len(rows); i += 1 {
		if len(rows[i]) < 2 || rows[i][1] == "" {
			break
		}
		tools = append(tools, rows[i][1])
	}
	pta.Tools = tools

	tests := []database.Test{}
	for i := testsIndexStart; i < len(rows); i += 1 {
		if len(rows[i]) < 15 || rows[i][1] == "" {
			break
		}
		id, _ := strconv.Atoi(rows[i][0])
		timeString, _ := strings.CutSuffix(rows[i][10], " min.")
		time, _ := strconv.Atoi(timeString)
		resitable := false
		if strings.ToLower(rows[i][11]) == "ja" {
			resitable = true
		}
		weight, _ := strconv.Atoi(rows[i][12])
		tests = append(tests, database.Test{
			Id:            id,
			YearAndPeriod: rows[i][1],
			Week:          rows[i][2],
			Subdomain:     rows[i][3],
			Description:   rows[i][4],
			Type:          rows[i][8],
			ResultType:    rows[i][9],
			Time:          time,
			Resitable:     resitable,
			Weight:        weight,
			Tools:         []int{},
		})
	}
	pta.Tests = tests

	return pta
}

func firstMatchAfterIndex(s []string, start int, condition func(string) bool) (string, bool) {
	for i := start; i < len(s); i++ {
		if condition(s[i]) {
			return s[i], true
		}
	}
	return "", false
}
