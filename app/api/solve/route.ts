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
    const { text, imageBase64, mode, userId, context, classId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Fetch User Credits & Reset Date
    let { data: userCredits } = await supabase
      .from('users_credits')
      .select('credits, is_pro, last_reset_date') // Fetch date
      .eq('id', userId)
      .maybeSingle();

    // Handle missing row (first time user)
    if (!userCredits) {
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ 
            id: userId, 
            credits: 5, 
            is_pro: false,
            last_reset_date: new Date().toISOString().split('T')[0] // Set today
        })
        .select()
        .single();
      userCredits = newCredits;
    }

    if (!userCredits) {
      return NextResponse.json({ error: 'Failed to load user credits' }, { status: 500 });
    }

    // 2. CHECK FOR DAILY RESET
    const today = new Date().toISOString().split('T')[0];
    
    // If the last reset was NOT today, reset credits to 5
    if (!userCredits.is_pro && userCredits.last_reset_date !== today) {
        await supabase
            .from('users_credits')
            .update({ 
                credits: 5, 
                last_reset_date: today 
            })
            .eq('id', userId);
            
        // Update local object so the check below passes
        userCredits.credits = 5;
    }

    // 3. Check if they have credits NOW
    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    // 4. FETCH LIVE NOTES & CONTEXT (RAG)
    let augmentedContext = context || '';
    
    if (classId) {
        const { data: notes } = await supabase
            .from('class_notes')
            .select('title, formatted_notes')
            .eq('class_id', classId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (notes && notes.length > 0) {
            const notesText = notes.map(n => `[Note: ${n.title}]\n${n.formatted_notes}`).join('\n\n');
            augmentedContext += `\n\n[HIDDEN CONTEXT - LIVE NOTES]:\nUse the following notes from the student's class to inform your answer. Prioritize this information:\n${notesText}`;
        }
    }

    // 5. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT,
    });

    let prompt = `[${mode.toUpperCase()} TASK]\n${text}`;
    if (augmentedContext) prompt += `\n\nCONTEXT FROM SYSTEM (Student cannot see this):\n${augmentedContext}`;
    
    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = await result.response.text();

    // 6. Deduct Credit (if not Pro)
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
}