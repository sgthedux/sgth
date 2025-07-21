// Script para debuggear documentos
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pwxnqxcbkfvjbcaqfzkx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eG5xeGNia2Z2amJjYXFmemt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NzY1NjMsImV4cCI6MjA0NzQ1MjU2M30.-tHIVZKxqLFdKmI0fS3jAQvJcKmNqCbPZWjfMqSdmLg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDocuments() {
  try {
    // Consultar todos los documentos del usuario
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', '66e19581-e47b-4872-9595-63c2d95c90a3')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('=== DOCUMENTOS ENCONTRADOS ===');
    console.log('Total documentos:', documents.length);
    console.log('');

    documents.forEach((doc, index) => {
      console.log(`Documento ${index + 1}:`);
      console.log('  ID:', doc.id);
      console.log('  Tipo:', doc.type);
      console.log('  Item ID:', doc.item_id);
      console.log('  Nombre:', doc.name);
      console.log('  URL:', doc.url);
      console.log('  Creado:', doc.created_at);
      console.log('  Subido:', doc.uploaded_at);
      console.log('  ---------------');
    });

    // Consultar también los registros de educación para ver los IDs
    console.log('\n=== REGISTROS DE EDUCACIÓN ===');
    const { data: education, error: eduError } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', '66e19581-e47b-4872-9595-63c2d95c90a3')
      .order('created_at', { ascending: false });

    if (eduError) {
      console.error('Error educación:', eduError);
      return;
    }

    education.forEach((edu, index) => {
      console.log(`Educación ${index + 1}:`);
      console.log('  ID:', edu.id);
      console.log('  Tipo:', edu.level);
      console.log('  Institución:', edu.institution);
      console.log('  Titulo:', edu.title);
      console.log('  ---------------');
    });

    // Consultar también los registros de experiencia
    console.log('\n=== REGISTROS DE EXPERIENCIA ===');
    const { data: experience, error: expError } = await supabase
      .from('experience')
      .select('*')
      .eq('user_id', '66e19581-e47b-4872-9595-63c2d95c90a3')
      .order('created_at', { ascending: false });

    if (expError) {
      console.error('Error experiencia:', expError);
      return;
    }

    experience.forEach((exp, index) => {
      console.log(`Experiencia ${index + 1}:`);
      console.log('  ID:', exp.id);
      console.log('  Empresa:', exp.company);
      console.log('  Puesto:', exp.position);
      console.log('  ---------------');
    });

    // Consultar también los registros de idiomas
    console.log('\n=== REGISTROS DE IDIOMAS ===');
    const { data: languages, error: langError } = await supabase
      .from('languages')
      .select('*')
      .eq('user_id', '66e19581-e47b-4872-9595-63c2d95c90a3')
      .order('created_at', { ascending: false });

    if (langError) {
      console.error('Error idiomas:', langError);
      return;
    }

    languages.forEach((lang, index) => {
      console.log(`Idioma ${index + 1}:`);
      console.log('  ID:', lang.id);
      console.log('  Idioma:', lang.language);
      console.log('  Nivel:', lang.level);
      console.log('  ---------------');
    });

  } catch (error) {
    console.error('Error general:', error);
  }
}

debugDocuments();
