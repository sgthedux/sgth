import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'add-columns') {
      console.log('🔄 Agregando columnas document_url...')
      
      const results = []
      
      // Verificar si las columnas ya existen
      const { data: experienceColumns, error: expColError } = await supabase
        .from('experience')
        .select('*')
        .limit(1)
      
      // Si no hay error, intentar agregar la columna usando query directa
      try {
        // Intentar agregar columna a experience - esto podría fallar si ya existe
        await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE experience ADD COLUMN document_url TEXT;'
        }).then(() => {
          results.push({ table: 'experience', success: true, action: 'added' })
        }).catch((err) => {
          // Si falla, probablemente la columna ya existe
          results.push({ table: 'experience', success: true, action: 'already_exists', error: err.message })
        })
      } catch (error: any) {
        results.push({ table: 'experience', success: false, error: error.message })
      }
      
      // Intentar un enfoque alternativo usando el SQL editor
      // En lugar de exec_sql, usar queries directas
      
      return NextResponse.json({
        success: true,
        message: 'Proceso iniciado - verifica manualmente en Supabase',
        results,
        instructions: {
          step1: 'Ve al SQL Editor en Supabase Dashboard',
          step2: 'Ejecuta: ALTER TABLE experience ADD COLUMN IF NOT EXISTS document_url TEXT;',
          step3: 'Ejecuta: ALTER TABLE education ADD COLUMN IF NOT EXISTS document_url TEXT;',
          step4: 'Ejecuta: ALTER TABLE languages ADD COLUMN IF NOT EXISTS document_url TEXT;'
        }
      })
      
    } else if (action === 'verify') {
      console.log('🔍 Verificando migración...')
      
      try {
        // Verificar estadísticas usando SELECT simple
        const { data: experienceData, error: expError } = await supabase
          .from('experience')
          .select('id, document_url')
        
        const { data: educationData, error: eduError } = await supabase
          .from('education')
          .select('id, document_url')
        
        const { data: languageData, error: langError } = await supabase
          .from('languages')
          .select('id, document_url')
        
        const stats = {
          experience: {
            total: experienceData?.length || 0,
            with_document: experienceData?.filter(item => item.document_url).length || 0,
            error: expError?.message
          },
          education: {
            total: educationData?.length || 0,
            with_document: educationData?.filter(item => item.document_url).length || 0,
            error: eduError?.message
          },
          languages: {
            total: languageData?.length || 0,
            with_document: languageData?.filter(item => item.document_url).length || 0,
            error: langError?.message
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Verificación completada',
          stats
        })
        
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: 'Error en verificación',
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Acción no reconocida'
    })
    
  } catch (error: any) {
    console.error('Error en migración:', error)
    return NextResponse.json({
      success: false,
      message: 'Error durante la migración',
      error: error.message
    }, { status: 500 })
  }
}
