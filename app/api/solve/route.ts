import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// UPDATED: General System Prompt
const SYSTEM_PROMPT = `You are LockIn AI, an advanced AI Study Companion.

YOUR GOAL:
Help the student with whatever they ask. You are no longer restricted to specific "Solver" or "Tutor" modes. 
- If they ask for a solution, solve it step-by-step.
- If they ask for an explanation, explain the concept clearly.
- If they ask to summarize notes, summarize them.
- If they just want to chat, be friendly and supportive.

ANTI-HALLUCINATION GUARDRAILS:
- **Strict Grounding:** Do not invent historical facts, citations, or mathematical principles.
- **Uncertainty:** If a question is ambiguous or lacks context, ask for clarification instead of guessing.
- **Math Verification:** Double-check all intermediate calculation steps before outputting the final result.

FORMATTING:
- Use LaTeX for math: $$ x^2 $$ or $ x $.
- Use Markdown for text (## Headings, **Bold**, etc).`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, userId, context, classId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Fetch User Credits & Reset Date
    let { data: userCredits } = await supabase
      .from('users_credits')
      .select('credits, is_pro, last_reset_date')
      .eq('id', userId)
      .maybeSingle();

    if (!userCredits) {
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ 
            id: userId, 
            credits: 5, 
            is_pro: false,
            last_reset_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      userCredits = newCredits;
    }

    // 2. CHECK FOR DAILY RESET
    const today = new Date().toISOString().split('T')[0];
    if (!userCredits.is_pro && userCredits.last_reset_date !== today) {
        await supabase
            .from('users_credits')
            .update({ credits: 5, last_reset_date: today })
            .eq('id', userId);
        userCredits.credits = 5;
    }

    // 3. Check Credits
    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    // 4. FETCH LIVE NOTES (RAG)
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
            augmentedContext += `\n\n[RELEVANT CLASS NOTES]:\nUse this context if helpful:\n${notesText}`;
        }
    }

    // 5. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT,
    });

    // UPDATED: Simple Prompt Construction
    let prompt = text;
    if (augmentedContext) prompt += `\n\nCONTEXT:\n${augmentedContext}`;
    
    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = await result.response.text();

    // 6. Deduct Credit
    if (!userCredits.is_pro) {
      await supabase.from('users_credits').update({ credits: userCredits.credits - 1 }).eq('id', userId);
    }

    // 7. Update Streak (Ensure this RPC exists in your DB from previous steps)
    await supabase.rpc('update_user_streak', { user_uuid: userId }).catch(() => {});

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