const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Verificando estructura de tablas...\n')
  
  try {
    // Verificar tabla experience
    console.log('📋 Tabla EXPERIENCE:')
    const { data: expData, error: expError } = await supabase
      .from('experience')
      .select('*')
      .limit(1)
    
    if (expError) {
      console.error('❌ Error en tabla experience:', expError.message)
    } else {
      console.log('✅ Tabla experience existe')
      if (expData && expData.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(expData[0]))
      }
    }
    
    // Verificar tabla languages
    console.log('\n📋 Tabla LANGUAGES:')
    const { data: langData, error: langError } = await supabase
      .from('languages')
      .select('*')
      .limit(1)
    
    if (langError) {
      console.error('❌ Error en tabla languages:', langError.message)
    } else {
      console.log('✅ Tabla languages existe')
      if (langData && langData.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(langData[0]))
      }
    }
    
    // Verificar tabla personal_info
    console.log('\n📋 Tabla PERSONAL_INFO:')
    const { data: personalData, error: personalError } = await supabase
      .from('personal_info')
      .select('*')
      .limit(1)
    
    if (personalError) {
      console.error('❌ Error en tabla personal_info:', personalError.message)
    } else {
      console.log('✅ Tabla personal_info existe')
      if (personalData && personalData.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(personalData[0]))
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message)
  }
}

checkTables()
