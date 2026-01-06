import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are ALTUS, an advanced Academic AI Assistant.

CORE PROTOCOLS:
1. **Solver Mode:** Provide direct, step-by-step solutions with final answers clearly marked. Use LaTeX for math.
2. **Tutor Mode:** Do not give the answer. Ask guiding questions to help the student solve it.
3. **Note Taker Mode:** When asked to format notes, ignore conversational fillers. Output strict, clean Markdown with summaries.

FORMATTING:
- Use LaTeX for math: $$ x^2 $$ or $ x $.
- Use Markdown for text (## Headings, **Bold**, etc).`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, mode, userId, context } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check Credits
    let { data: userCredits } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', userId)
      .maybeSingle();

    if (!userCredits) {
      // Create if missing
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ id: userId, credits: 5, is_pro: false })
        .select()
        .single();
      userCredits = newCredits;
    }

    // Hard Stop if 0 credits (and not pro)
    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    // 2. Initialize Gemini 2.0
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    
    // *** CRITICAL UPDATE: USING GEMINI 2.0 ***
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', // Updated from 1.5-flash
      systemInstruction: SYSTEM_PROMPT,
    });

    let prompt = mode === 'solver' 
      ? `[SOLVER TASK]\n${text}` 
      : `[TUTOR TASK]\n${text}`;
      
    if (context) prompt += `\n\nCONTEXT FROM ASSIGNMENT:\n${context}`;
    
    // 3. Generate
    let result;
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = await result.response.text();

    // 4. Deduct Credit (if not pro)
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