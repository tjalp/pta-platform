package pdf

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tjalp/pta-platform/database"
	"github.com/xuri/excelize/v2"
)

type PdfExporter struct {
}

// //go:embed resources/pta-template.xlsx
// var template embed.FS

func (e PdfExporter) Export(ctx *gin.Context, pta []database.PtaData, subjects []database.Subject) error {
	//templateFile, err := os.Open("pta-template.xlsx")
	//// templateFile, err := template.Open("resources/pta-template.xlsx")
	//if err != nil {
	//	return err
	//}
	//defer templateFile.Close()
	//file, err := excelize.OpenReader(templateFile)
	if len(pta) == 0 {
		return fmt.Errorf("no pta data provided")
	}
	fmt.Println(pta[0])
	level := strings.ReplaceAll(strings.TrimSpace(strings.ToLower(pta[0].Level)), " ", "")
	file, err := excelize.OpenFile("pta-template-" + level + ".xlsx")
	if err != nil {
		return err
	}
	defer func(file *excelize.File) {
		err := file.Close()
		if err != nil {
			fmt.Println("error closing file:", err)
		}
	}(file)

	//err = file.SetSheetName(file.GetSheetName(0), pta[0].Name)
	//if err != nil {
	//	return err
	//}

	for _, pta := range pta {
		index, err := file.NewSheet(pta.Name)
		if err != nil {
			return err
		}
		err = file.CopySheet(0, index)
		if err != nil {
			return err
		}
		var subjectIndex = -1
		for i, subject := range subjects {
			if strings.EqualFold(subject.Name, pta.Name) && strings.EqualFold(subject.Level, pta.Level) {
				subjectIndex = i
				break
			}
		}
		if subjectIndex >= len(subjects) || subjectIndex < 0 || strings.ToLower(subjects[subjectIndex].Level) != strings.ToLower(pta.Level) {
			return fmt.Errorf("subject not found for pta %s, subjectIndex: %d, subjectLength: %d", pta.Name, subjectIndex, len(subjects))
		}
		subject := subjects[subjectIndex]
		err = addPtaSheet(file, pta, subject)
		if err != nil {
			return err
		}
	}

	err = file.DeleteSheet(file.GetSheetName(0))
	if err != nil {
		return err
	}

	if len(pta) == 1 {
		file.Path = pta[0].Name + " PTA " + pta[0].Level + " " + pta[0].Cohort + ".xlsx"
	} else {
		file.Path = "PTA " + pta[0].Level + " " + pta[0].Cohort + ".xlsx"
	}

	err = file.UpdateLinkedValue()
	if err != nil {
		return err
	}

	// Set the response headers
	ctx.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Path))
	ctx.Header("Content-Type", "application/octet-stream")
	if err := file.Write(ctx.Writer); err != nil {
		return err
	}

	// Return the file as a reader with the gin ctx
	ctx.Status(http.StatusOK)

	return nil
}

func addPtaSheet(file *excelize.File, pta database.PtaData, subject database.Subject) error {
	// Loop over every cell of every row
	rows, err := file.GetRows(pta.Name)
	if err != nil {
		return err
	}

	usedToolsIndexes := make(map[int]bool)
	for _, test := range pta.Tests {
		for _, tool := range test.Tools {
			usedToolsIndexes[tool] = true
		}
	}
	remappedTools := make(map[int]int)
	toolIndex := 0
	for i := 0; i < len(pta.Tools); i++ {
		if usedToolsIndexes[i] {
			remappedTools[i] = toolIndex
			toolIndex++
		}
	}
	usedTools := make([]string, 0)
	for i := 0; i < len(pta.Tools); i++ {
		if usedToolsIndexes[i] {
			usedTools = append(usedTools, pta.Tools[i])
		}
	}

	for rowIndex, row := range rows {
		for i, cell := range row {
			replaceCellValue(pta.Name, cell, "{{name}}", pta.Name, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{level}}", pta.Level, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{cohort}}", pta.Cohort, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{responsible}}", subject.Responsible, rowIndex+1, i+1, file)

			// Special cases
			if strings.Contains(cell, "{{weights}}") {
				for j, weight := range pta.Weights {
					coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+j+1)
					if err != nil {
						fmt.Println("error converting coordinates to cell name:", err)
						return err
					}
					err = file.SetCellInt(pta.Name, coords, weight)
					if err != nil {
						return err
					}
				}
			}

			if strings.Contains(cell, "{{tools}}") {
				replaceCellValue(pta.Name, cell, "{{tools}}", "", rowIndex+1, i+1, file)
				for toolIndex, tool := range usedTools {
					coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+toolIndex+1)
					if err != nil {
						fmt.Println("error converting coordinates to cell name:", err)
						return err
					}
					err = file.SetCellValue(pta.Name, coords, tool)
					if err != nil {
						return err
					}
				}
			}

			if strings.Contains(cell, "{{else.id}}") {
				replaceCellValue(pta.Name, cell, "{{else.id}}", "", rowIndex+1, i+1, file)
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						err = file.SetCellValue(pta.Name, coords, test.Id)
						if err != nil {
							return err
						}
					}
				}
			}

			if strings.Contains(cell, "{{else.type}}") {
				replaceCellValue(pta.Name, cell, "{{else.type}}", "", rowIndex+1, i+1, file)
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						if test.Type == "anders" {
							err = file.SetCellValue(pta.Name, coords, test.TypeElse)
						} else {
							err = file.SetCellValue(pta.Name, coords, test.Type)
						}
						if err != nil {
							return err
						}
					}
				}
			}

			if strings.Contains(cell, "{{else.time}}") {
				replaceCellValue(pta.Name, cell, "{{else.time}}", "", rowIndex+1, i+1, file)
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						if test.Time == 0 {
							err = file.SetCellValue(pta.Name, coords, test.TimeElse)
						} else {
							err = file.SetCellValue(pta.Name, coords, test.Time)
						}
						if err != nil {
							return err
						}
					}
				}
			}
		}
	}

	// Reloop over every cell of every row to replace the test data
	for rowIndex, row := range rows {
		for _, cell := range row {
			if strings.Contains(cell, "{{test.id}}") {
				// Add the same amount of new rows as there are tests
				for j := 1; j < len(pta.Tests); j++ {
					err := file.DuplicateRow(pta.Name, rowIndex+1)
					if err != nil {
						return err
					}
				}
			}
		}
	}

	// Loop over every cell of every row
	rows, err = file.GetRows(pta.Name)
	if err != nil {
		return err
	}
	testIndex := 0
	for rowIndex, row := range rows {
		var containedTest bool
		for i, cell := range row {
			if len(pta.Tests) == 0 || pta.Tests == nil {
				if strings.Contains(cell, "{{test.id}}") {
					err := file.RemoveRow(pta.Name, rowIndex+1)
					if err != nil {
						return err
					}
					return nil
				}
				continue
			}

			test := pta.Tests[testIndex]

			var resitable string
			if test.Resitable {
				resitable = "ja"
			} else {
				resitable = "nee"
			}
			var time string
			if test.Time == 0 {
				time = "anders"
			} else {
				time = strconv.Itoa(test.Time)
			}
			var tools string
			testToolIndexes := test.Tools
			sort.Ints(testToolIndexes)
			for i, tool := range testToolIndexes {
				if i != 0 {
					tools += ", "
				}
				tools += strconv.Itoa(remappedTools[tool] + 1)
			}
			didContainTest := replaceCellValue(pta.Name, cell, "{{test.id}}", strconv.Itoa(test.Id), rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.year_and_period}}", test.YearAndPeriod, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.week}}", test.Week, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.subdomain}}", test.Subdomain, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.description}}", test.Description, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.type}}", test.Type, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.type_else}}", test.TypeElse, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.result_type}}", test.ResultType, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.time}}", time, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.time_else}}", test.TimeElse, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.resitable}}", resitable, rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.pta_weight}}", strconv.Itoa(test.PtaWeight), rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.pod_weight}}", strconv.Itoa(test.PodWeight), rowIndex+1, i+1, file)
			replaceCellValue(pta.Name, cell, "{{test.tools}}", tools, rowIndex+1, i+1, file)
			if didContainTest {
				containedTest = true
			}
		}
		if containedTest {
			if testIndex < len(pta.Tests)-1 {
				testIndex++
			}
		}
	}
	return nil
}

// Returns whether the cell did contain the correct key
func replaceCellValue(sheetName string, cellValue string, key string, replacement string, coordRow int, coordCol int, file *excelize.File) bool {
	if strings.Contains(cellValue, key) {
		cellValue = strings.ReplaceAll(cellValue, key, replacement)
		coords, err := excelize.CoordinatesToCellName(coordCol, coordRow)
		if err != nil {
			fmt.Println("error converting coordinates to cell name:", err)
			return true
		}
		err = file.SetCellValue(sheetName, coords, cellValue)
		if err != nil {
			return false
		}
		return true
	}
	return false
}
