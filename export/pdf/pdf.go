package pdf

import (
	"fmt"
	"net/http"
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

func (e PdfExporter) Export(ctx *gin.Context, pta database.PtaData) error {
	//templateFile, err := os.Open("pta-template.xlsx")
	//// templateFile, err := template.Open("resources/pta-template.xlsx")
	//if err != nil {
	//	return err
	//}
	//defer templateFile.Close()
	//file, err := excelize.OpenReader(templateFile)
	file, err := excelize.OpenFile("pta-template.xlsx")
	if err != nil {
		return err
	}
	defer file.Close()

	file.SetSheetName(file.GetSheetName(0), pta.Name)

	// Loop over every cell of every row
	rows, err := file.GetRows(pta.Name)
	if err != nil {
		return err
	}
	for rowIndex, row := range rows {
		for i, cell := range row {
			replaceCellValue(cell, "{{name}}", pta.Name, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{level}}", pta.Level, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{cohort}}", pta.Cohort, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{responsible}}", pta.Responsible, rowIndex+1, i+1, file)

			// Special cases
			if strings.Contains(cell, "{{weights}}") {
				for j, weight := range pta.Weights {
					coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+j+1)
					if err != nil {
						fmt.Println("error converting coordinates to cell name:", err)
						return err
					}
					file.SetCellInt(pta.Name, coords, weight)
				}
			}

			if strings.Contains(cell, "{{tools}}") {
				for toolIndex, tool := range pta.Tools {
					coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+toolIndex+1)
					if err != nil {
						fmt.Println("error converting coordinates to cell name:", err)
						return err
					}
					file.SetCellValue(pta.Name, coords, tool)
				}
			}

			if strings.Contains(cell, "{{else.id}}") {
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						file.SetCellValue(pta.Name, coords, test.Id)
					}
				}
			}

			if strings.Contains(cell, "{{else.type}}") {
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						if test.Type == "anders" {
							file.SetCellValue(pta.Name, coords, test.TypeElse)
						} else {
							file.SetCellValue(pta.Name, coords, test.Type)
						}
					}
				}
			}

			if strings.Contains(cell, "{{else.time}}") {
				for _, test := range pta.Tests {
					if test.Time == 0 || test.Type == "anders" {
						coords, err := excelize.CoordinatesToCellName(i+1, rowIndex+1)
						if err != nil {
							fmt.Println("error converting coordinates to cell name:", err)
							return err
						}
						if test.Time == 0 {
							file.SetCellValue(pta.Name, coords, test.TimeElse)
						} else {
							file.SetCellValue(pta.Name, coords, test.Time)
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
					file.DuplicateRow(pta.Name, rowIndex+1)
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
		for i, cell := range row {
			var resitable string
			if pta.Tests[testIndex].Resitable {
				resitable = "ja"
			} else {
				resitable = "nee"
			}
			var time string
			if pta.Tests[testIndex].Time == 0 {
				time = "anders"
			} else {
				time = strconv.Itoa(pta.Tests[testIndex].Time)
			}
			var tools string
			for i, tool := range pta.Tests[testIndex].Tools {
				if i != 0 {
					tools += ", "
				}
				tools += strconv.Itoa(tool + 1)
			}
			containedTest := replaceCellValue(cell, "{{test.id}}", strconv.Itoa(pta.Tests[testIndex].Id), rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.year_and_period}}", pta.Tests[testIndex].YearAndPeriod, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.week}}", pta.Tests[testIndex].Week, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.subdomain}}", pta.Tests[testIndex].Subdomain, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.description}}", pta.Tests[testIndex].Description, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.type}}", pta.Tests[testIndex].Type, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.type_else}}", pta.Tests[testIndex].TypeElse, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.result_type}}", pta.Tests[testIndex].ResultType, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.time}}", time, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.time_else}}", pta.Tests[testIndex].TimeElse, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.resitable}}", resitable, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.pta_weight}}", strconv.Itoa(pta.Tests[testIndex].PtaWeight), rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.pod_weight}}", strconv.Itoa(pta.Tests[testIndex].PodWeight), rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{test.tools}}", tools, rowIndex+1, i+1, file)

			if containedTest {
				if testIndex < len(pta.Tests)-1 {
					testIndex++
				}
			}
		}
	}

	file.Path = "PTA " + pta.Name + " " + pta.Level + " " + pta.Cohort + ".xlsx"
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

// Returns whether the cell did contain the correct key
func replaceCellValue(cellValue string, key string, replacement string, coordRow int, coordCol int, file *excelize.File) bool {
	if strings.Contains(cellValue, key) {
		cellValue = strings.ReplaceAll(cellValue, key, replacement)
		coords, err := excelize.CoordinatesToCellName(coordCol, coordRow)
		if err != nil {
			fmt.Println("error converting coordinates to cell name:", err)
			return true
		}
		file.SetCellValue(file.GetSheetName(0), coords, cellValue)
		return true
	}
	return false
}
