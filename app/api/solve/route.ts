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
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: Missing Gemini API Key' }, { status: 500 });
    }

    const { text, imageBase64, mode, userId, context, classId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Fetch User Credits
    // We select '*' to avoid crashing if 'last_reset_date' column is missing in the DB
    let { data: userCredits, error: dbError } = await supabase
      .from('users_credits')
      .select('*') 
      .eq('id', userId)
      .maybeSingle();

    if (dbError) {
        console.error("DB Error:", dbError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Handle first-time user
    if (!userCredits) {
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ 
            id: userId, 
            credits: 5, 
            is_pro: false,
            // Safe fallback if column doesn't exist yet
            ...( 'last_reset_date' in (userCredits || {}) ? { last_reset_date: new Date().toISOString().split('T')[0] } : {}) 
        })
        .select()
        .single();
      userCredits = newCredits;
    }

    // 2. CHECK FOR DAILY RESET (Safe Mode)
    // Only attempt reset if the column exists in the returned data
    if (userCredits && 'last_reset_date' in userCredits) {
        const today = new Date().toISOString().split('T')[0];
        if (!userCredits.is_pro && userCredits.last_reset_date !== today) {
            await supabase
                .from('users_credits')
                .update({ credits: 5, last_reset_date: today })
                .eq('id', userId);
            userCredits.credits = 5; // Grant credits locally for this run
        }
    }

    // 3. Check Balance
    if (userCredits && !userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Daily limit reached. Upgrade to Pro for unlimited access.' }, { status: 402 });
    }

    // 4. Build Context (RAG)
    let augmentedContext = context || '';
    if (classId) {
        const { data: notes } = await supabase
            .from('class_notes')
            .select('title, formatted_notes')
            .eq('class_id', classId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (notes && notes.length > 0) {
            const notesText = notes.map((n: any) => `[Note: ${n.title}]\n${n.formatted_notes}`).join('\n\n');
            augmentedContext += `\n\n[HIDDEN CONTEXT - LIVE NOTES]:\nUse the following notes from the student's class to inform your answer:\n${notesText}`;
        }
    }

    // 5. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

    // Use gemini-pro-vision for images, gemini-pro for text
    const modelName = imageBase64 ? 'gemini-pro-vision' : 'gemini-pro';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Include system prompt in the user prompt since systemInstruction may not be supported
    let prompt = `${SYSTEM_PROMPT}\n\n[${mode.toUpperCase()} TASK]\n${text}`;
    if (augmentedContext) prompt += `\n\nCONTEXT FROM SYSTEM:\n${augmentedContext}`;

    let result;
    try {
        if (imageBase64) {
            const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
        } else {
            result = await model.generateContent(prompt);
        }
    } catch (aiError: any) {
        console.error("Gemini API Error:", aiError);
        return NextResponse.json({ error: 'AI Service Error. Please try again.' }, { status: 503 });
    }

    const responseText = await result.response.text();

    // 6. Deduct Credit
    if (userCredits && !userCredits.is_pro) {
      await supabase.from('users_credits').update({ credits: userCredits.credits - 1 }).eq('id', userId);
    }

    return NextResponse.json({
      response: responseText,
      remainingCredits: userCredits?.is_pro ? 999 : (userCredits?.credits || 1) - 1,
      isPro: userCredits?.is_pro,
    });

  } catch (error: any) {
    console.error('General API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}