// Script para probar el endpoint de actualización de estado
const testUpdateStatus = async () => {
  try {
    console.log('🧪 Probando endpoint de actualización de estado...')
    
    // Datos de prueba (ajusta el licenseId por uno real de tu base de datos)
    const testData = {
      licenseId: 'test-license-id', // Cambia esto por un ID real
      status: 'en_revision',
      comments: 'Prueba de actualización de estado desde API'
    }
    
    const response = await fetch('http://localhost:3000/api/licenses/update-status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log('📊 Respuesta del servidor:')
    console.log('Status:', response.status)
    console.log('Datos:', result)
    
    if (result.success) {
      console.log('✅ El endpoint funciona correctamente!')
    } else {
      console.log('❌ Error en el endpoint:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error)
  }
}

// Ejecutar prueba
testUpdateStatus()
