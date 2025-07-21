import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const userId = '66e19581-e47b-4872-9595-63c2d95c90a3'
    
    // Consultar documentos existentes
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    // Consultar registros de educación
    const { data: education, error: eduError } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (eduError) {
      console.error('Error education:', eduError)
      return Response.json({ error: eduError.message }, { status: 500 })
    }
    
    // Consultar registros de experiencia
    const { data: experience, error: expError } = await supabase
      .from('experience')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (expError) {
      console.error('Error experience:', expError)
      return Response.json({ error: expError.message }, { status: 500 })
    }
    
    // Consultar registros de idiomas
    const { data: languages, error: langError } = await supabase
      .from('languages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (langError) {
      console.error('Error languages:', langError)
      return Response.json({ error: langError.message }, { status: 500 })
    }
    
    return Response.json({
      documents,
      education,
      experience,
      languages,
      analysis: {
        total_documents: documents.length,
        education_records: education.length,
        experience_records: experience.length,
        language_records: languages.length
      }
    })
    
  } catch (error) {
    console.error('Error general:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
