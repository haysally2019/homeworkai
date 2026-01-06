import { createClient } from 'jsr:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.1';
import pdf from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const { data: document, error: docError } = await supabase
      .from('class_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    await supabase
      .from('class_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    const { data: fileData, error: storageError } = await supabase.storage
      .from('class-documents')
      .download(document.file_path);

    if (storageError || !fileData) {
      throw new Error('Failed to download file');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdfData = await pdf(buffer);
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text extracted from PDF');
    }

    const chunks = chunkText(fullText, 800);

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const result = await model.embedContent(chunk);
      const embedding = result.embedding.values;

      await supabase.from('document_chunks').insert({
        document_id: documentId,
        class_id: document.class_id,
        user_id: document.user_id,
        content: chunk,
        chunk_index: i,
        embedding: JSON.stringify(embedding),
      });
    }

    await supabase
      .from('class_documents')
      .update({ processing_status: 'completed' })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ success: true, chunksProcessed: chunks.length }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing document:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function chunkText(text: string, maxChunkSize: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
