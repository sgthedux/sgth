const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeTemplate() {
  try {
    console.log('🔍 Analizando estructura de plantilla...')
    const templatePath = path.join(__dirname, 'public', 'plantilla-licencias.xlsx')
    
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    
    const worksheet = workbook.worksheets[0]
    console.log('📝 Nombre de la hoja:', worksheet.name)
    
    // Analizar filas 1-20 para entender la estructura
    console.log('\n📊 Estructura de la plantilla:')
    for (let row = 1; row <= 20; row++) {
      console.log(`Fila ${row}:`)
      for (let col = 1; col <= 12; col++) {
        const cell = worksheet.getCell(row, col)
        if (cell.value) {
          const cellAddress = cell.address
          console.log(`  ${cellAddress}: "${cell.value}"`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

analyzeTemplate()
