// supabase/functions/process-document/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'
// Import PDF.js for Deno
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm';

// Set worker to null to avoid worker-loader issues in Edge runtime
pdfjs.GlobalWorkerOptions.workerSrc = '';

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
    
    if (doc.file_type === 'application/pdf' || doc.file_path.endsWith('.pdf')) {
      // --- PDF Parsing Logic ---
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          useSystemFonts: true, // helps with font loading errors in edge
        });
        
        const pdf = await loadingTask.promise;
        const maxPages = pdf.numPages;
        
        // Extract text from all pages
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          textContent += `[Page ${i}]\n${pageText}\n\n`;
        }
      } catch (pdfError) {
        console.error('PDF Parse Error:', pdfError);
        textContent = `[Error parsing PDF content for: ${doc.filename}]`;
      }
    } else if (doc.file_type === 'text/markdown' || doc.file_path.endsWith('.md') || doc.file_type === 'text/plain') {
      textContent = await fileData.text()
    } else {
      textContent = `[Unsupported file type: ${doc.filename}]` 
    }

    // 5. Generate Embeddings (Chunking)
    // Clean up text slightly before chunking
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    
    // Simple overlapping chunking
    const chunkSize = 1000;
    const overlap = 100;
    const chunks = [];
    
    for (let i = 0; i < cleanText.length; i += (chunkSize - overlap)) {
      chunks.push(cleanText.slice(i, i + chunkSize));
    }
    
    for (const chunk of chunks) {
      if (!chunk.trim()) continue; // Skip empty chunks

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