package pdf

import (
	"github.com/gin-gonic/gin"
	"github.com/tjalp/pta-platform/database"
)

type Exporter struct {
}

func (e Exporter) Export(ctx *gin.Context, pta database.PtaData) error {
	//TODO implement me
	panic("implement me")
}
