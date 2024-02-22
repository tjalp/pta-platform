package pdf

import (
	"fmt"
	"net/http"
	"os"
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
	templateFile, err := os.Open("pta-template.xlsx")
	// templateFile, err := template.Open("resources/pta-template.xlsx")
	if err != nil {
		return err
	}
	defer templateFile.Close()
	file, err := excelize.OpenReader(templateFile)
	if err != nil {
		return err
	}
	defer file.Close()

	// Loop over every cell of every row
	rows, err := file.GetRows(file.GetSheetName(0))
	if err != nil {
		return err
	}
	for rowIndex, row := range rows {
		for i, cell := range row {
			replaceCellValue(cell, "{{name}}", pta.Name, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{level}}", pta.Level, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{cohort}}", pta.Cohort, rowIndex+1, i+1, file)
			replaceCellValue(cell, "{{responsible}}", pta.Responsible, rowIndex+1, i+1, file)
		}
	}

	file.Path = "PTA " + pta.Name + " " + pta.Level + " " + pta.Cohort + ".xlsx"

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

func replaceCellValue(cellValue string, key string, replacement string, coordRow int, coordCol int, file *excelize.File) {
	if strings.Contains(cellValue, key) {
		cellValue = strings.ReplaceAll(cellValue, key, replacement)
		coords, err := excelize.CoordinatesToCellName(coordCol, coordRow)
		if err != nil {
			fmt.Println("error converting coordinates to cell name:", err)
			return
		}
		file.SetCellValue(file.GetSheetName(0), coords, cellValue)
	}
}
