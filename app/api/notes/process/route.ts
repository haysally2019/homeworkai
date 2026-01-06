import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { classId, userId, title, rawNotes } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!classId || !rawNotes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const formattingPrompt = `Format and organize these class notes into clean, well-structured markdown.

Use proper markdown formatting including:
- Headers (## and ###) for main topics and subtopics
- Bullet points for lists
- **Bold** for key terms and important concepts
- Code blocks for formulas or technical content
- Clear paragraph breaks

Original Notes:
${rawNotes}

Return ONLY the formatted markdown notes, nothing else.`;

    const summaryPrompt = `Create a concise summary of these class notes (2-3 sentences maximum). Focus on the main topics and key takeaways.

Notes:
${rawNotes}

Return ONLY the summary text, nothing else.`;

    const [formattedResult, summaryResult] = await Promise.all([
      model.generateContent(formattingPrompt),
      model.generateContent(summaryPrompt)
    ]);

    const formattedNotes = (await formattedResult.response.text()).trim();
    const summary = (await summaryResult.response.text()).trim();

    const { data: savedNote, error: dbError } = await supabase
      .from('class_notes')
      .insert({
        class_id: classId,
        user_id: userId,
        title,
        raw_notes: rawNotes,
        formatted_notes: formattedNotes,
        summary,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save notes to database');
    }

    return NextResponse.json({
      success: true,
      note: savedNote,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process notes' }, { status: 500 });
  }
}
