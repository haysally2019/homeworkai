import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { documentId } = await req.json()
    
    // 1. Setup Clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

    // 2. Fetch Document Metadata
    const { data: doc, error: docError } = await supabase
      .from('class_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError) throw docError

    // 3. Download File
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('class-documents')
      .download(doc.file_path)

    if (downloadError) throw downloadError

    // 4. Extract Text
    let textContent = ''
    if (doc.file_type === 'text/markdown' || doc.file_path.endsWith('.md')) {
      textContent = await fileData.text()
    } else {
      // For PDFs, we assume text or placeholder for now
      textContent = "Scanned PDF Content: " + doc.filename 
    }

    // 5. Generate Embeddings (Chunking)
    const chunks = textContent.match(/[\s\S]{1,1000}/g) || [] 
    
    for (const chunk of chunks) {
      const result = await model.embedContent(chunk)
      const embedding = result.embedding.values

      await supabase.from('embeddings').insert({
        document_id: documentId,
        content: chunk,
        embedding: embedding
      })
    }

    // 6. Mark as Completed
    await supabase
      .from('class_documents')
      .update({ processing_status: 'completed' })
      .eq('id', documentId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})