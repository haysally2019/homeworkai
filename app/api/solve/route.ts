import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are ALTUS, an advanced Academic AI Assistant powered by Google Gemini.

CORE PROTOCOLS:
1. **Solver Mode:** Provide direct, step-by-step solutions with final answers clearly marked. Use LaTeX for math.
2. **Tutor Mode:** Do not give the answer. Ask guiding questions to help the student solve it.
3. **Essay Grader Mode:** Analyze the text for thesis strength, argument structure, grammar, and clarity. Provide a Letter Grade (A-F) and 3 specific bullet points for improvement.
4. **Note Taker Mode:** Output strict, clean Markdown with headers and summaries.

ANTI-HALLUCINATION GUARDRAILS:
- **Strict Grounding:** Do not invent historical facts, citations, or mathematical principles.
- **Uncertainty:** If a question is ambiguous or lacks context, ask for clarification instead of guessing.
- **Math Verification:** Double-check all intermediate calculation steps before outputting the final result.

FORMATTING:
- Use LaTeX for math: $$ x^2 $$ or $ x $.
- Use Markdown for text (## Headings, **Bold**, etc).`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, mode, userId, context } = await request.json();
    const { text, imageBase64, mode, userId, context, classId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

@@ -57,39 +57,58 @@
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    // 2. Initialize Gemini
    // 2. FETCH LIVE NOTES & CONTEXT (RAG)
    let augmentedContext = context || '';
    
    if (classId) {
        // Fetch recent notes for this class
        const { data: notes } = await supabase
            .from('class_notes')
            .select('title, formatted_notes')
            .eq('class_id', classId)
            .order('created_at', { ascending: false })
            .limit(3); // Fetch last 3 notes to keep context relevant but concise

        if (notes && notes.length > 0) {
            const notesText = notes.map(n => `[Note: ${n.title}]\n${n.formatted_notes}`).join('\n\n');
            augmentedContext += `\n\n[HIDDEN CONTEXT - LIVE NOTES]:\nUse the following notes from the student's class to inform your answer. Prioritize this information:\n${notesText}`;
        }
        
        // (Optional) If you had document chunks, you would fetch them here using pgvector
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

    // Using experimental flash model for speed and accuracy
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', 
      model: 'gemini-2.0-flash-exp', // 2.0 Flash has huge context window, perfect for stuffing notes
      systemInstruction: SYSTEM_PROMPT,
    });

    let prompt = `[${mode.toUpperCase()} TASK]\n${text}`;
    if (context) prompt += `\n\nCONTEXT FROM ASSIGNMENT:\n${context}`;
    if (augmentedContext) prompt += `\n\nCONTEXT FROM SYSTEM (Student cannot see this):\n${augmentedContext}`;

    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = await result.response.text();

    if (!userCredits.is_pro) {
      await supabase.from('users_credits').update({ credits: userCredits.credits - 1 }).eq('id', userId);
    }

    return NextResponse.json({
      response: responseText,
      remainingCredits: userCredits.is_pro ? 999 : userCredits.credits - 1,
      isPro: userCredits.is_pro,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }