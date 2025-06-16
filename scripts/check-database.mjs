import { createClient } from "@supabase/supabase-js"

async function checkDatabaseStructure() {
  try {
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    console.log("🔍 Revisando estructura de la base de datos...")

    const tables = ['profiles', 'personal_info', 'education', 'experience', 'languages']
    
    for (const table of tables) {
      try {
        console.log(`\n📊 Tabla: ${table}`)
        
        // Obtener conteo de registros
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.log(`❌ Error al contar registros en ${table}:`, countError.message)
          continue
        }
        
        console.log(`📈 Registros: ${count}`)
        
        if (count && count > 0) {
          // Obtener un registro de ejemplo
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (error) {
            console.log(`❌ Error al obtener datos de ${table}:`, error.message)
          } else if (data && data.length > 0) {
            console.log(`🔍 Campos disponibles:`, Object.keys(data[0]))
            console.log(`📄 Ejemplo de datos:`, data[0])
          }
        }
      } catch (error) {
        console.log(`❌ Error al procesar tabla ${table}:`, error.message)
      }
    }

    // Verificar si hay datos en auth.users
    try {
      console.log(`\n👥 Verificando usuarios en auth.users...`)
      const { data: users, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        console.log('❌ Error al obtener usuarios:', error.message)
      } else {
        console.log(`📈 Usuarios en auth: ${users.users.length}`)
        if (users.users.length > 0) {
          console.log(`🔍 Primer usuario:`, {
            id: users.users[0].id,
            email: users.users[0].email,
            created_at: users.users[0].created_at,
            user_metadata: users.users[0].user_metadata
          })
        }
      }
    } catch (error) {
      console.log('❌ Error al verificar auth.users:', error.message)
    }

  } catch (error) {
    console.error("❌ Error general:", error)
  }
}

checkDatabaseStructure()
