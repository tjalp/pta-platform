package export

import (
	"github.com/gin-gonic/gin"
	"github.com/tjalp/pta-platform/database"
)

type Exporter interface {
	Export(ctx *gin.Context, pta []database.PtaData) error
}
