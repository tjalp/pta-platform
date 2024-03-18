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
	podColumn := 0
	ptaColumn := 0

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
			if cell == "POD" {
				podColumn = index
			}
			if cell == "PTA" {
				ptaColumn = index
			}
		}
	}

	var tools []string
	for i := toolsIndexStart; i < len(rows); i += 1 {
		if len(rows[i]) < 2 || rows[i][1] == "" {
			break
		}
		tools = append(tools, rows[i][1])
	}
	pta.Tools = tools

	var tests []database.Test
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
		podWeight, _ := strconv.Atoi(rows[i][podColumn])
		ptaWeight, _ := strconv.Atoi(rows[i][ptaColumn])
		testToolsString := rows[i][14]
		testTools := []int{}

		if strings.Contains(testToolsString, " t/m ") {
			tools := strings.Split(testToolsString, " t/m ")
			start, _ := strconv.Atoi(tools[0])
			end, _ := strconv.Atoi(tools[1])
			for j := start; j <= end; j++ {
				testTools = append(testTools, j)
			}
		} else {
			testToolsString = strings.Replace(testToolsString, " en ", ", ", -1)
			testToolsString = strings.Replace(testToolsString, "-", ", ", -1)
			testToolsString = strings.Replace(testToolsString, "&", ", ", -1)
			tools := strings.Split(testToolsString, ", ")
			for _, tool := range tools {
				toolInt, err := strconv.Atoi(strings.TrimSpace(tool))
				if err != nil {
					continue
				}
				testTools = append(testTools, toolInt)
			}
		}

		for i := range testTools {
			testTools[i] = testTools[i] - 1
		}

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
			PodWeight:     podWeight,
			PtaWeight:     ptaWeight,
			Tools:         testTools,
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
