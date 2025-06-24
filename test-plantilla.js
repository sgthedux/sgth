const ExcelJS = require('exceljs');
const path = require('path');

async function testTemplate() {
  try {
    console.log('🔍 Probando lectura de plantilla...')
    const templatePath = path.join(__dirname, 'public', 'plantilla-licencias.xlsx')
    console.log('📄 Ruta de plantilla:', templatePath)
    
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    
    console.log('✅ Plantilla cargada exitosamente')
    console.log('📊 Número de hojas:', workbook.worksheets.length)
    
    const worksheet = workbook.worksheets[0]
    console.log('📝 Nombre de la primera hoja:', worksheet.name)
    
    // Verificar algunas celdas importantes
    console.log('\n🔍 Contenido de celdas clave:')
    console.log('A1:', worksheet.getCell('A1').value)
    console.log('A4:', worksheet.getCell('A4').value)
    console.log('F4:', worksheet.getCell('F4').value)
    console.log('A8:', worksheet.getCell('A8').value)
    console.log('J8:', worksheet.getCell('J8').value)
    
    // Verificar área de tipos de permiso
    console.log('\n📋 Área de tipos de permiso:')
    console.log('B13:', worksheet.getCell('B13').value)
    console.log('D13:', worksheet.getCell('D13').value)
    console.log('F13:', worksheet.getCell('F13').value)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testTemplate()
