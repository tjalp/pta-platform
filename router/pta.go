package router

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/tjalp/pta-platform/database"
)

func ReadRows(rows [][]string) database.PtaData {
	pta := database.PtaData{}
	pta.Id = uuid.NewString()[0:6]
	pta.Name = rows[0][0]

	toolsIndexStart := 0

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
		}
	}

	tools := []string{}
	for i := toolsIndexStart; i < len(rows); i += 1 {
		fmt.Println(rows[i])

		if len(rows[i]) < 2 || rows[i][1] == "" {
			break
		}
		tools = append(tools, rows[i][1])
	}

	pta.Tools = tools

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
