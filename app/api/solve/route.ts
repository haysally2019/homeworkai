import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are ALTUS, a University Verification Engine.
YOUR PROTOCOL:
1. Thinking: Internally simulate code execution for Math/Science. Verify sources for Humanities.
2. Modes:
   - [SOLVER MODE]: Output step-by-step logic + Final Answer in LaTeX.
   - [TUTOR MODE]: Ask guiding questions. Do NOT reveal the answer.`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, mode, userId, context } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // --- Credit Check Logic ---
    let { data: userCredits, error } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', userId)
      .maybeSingle();

    if (!userCredits) {
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ id: userId, credits: 3, is_pro: false })
        .select()
        .single();
      userCredits = newCredits;
    }

    if (!userCredits) {
      return NextResponse.json({ error: 'Failed to load user credits' }, { status: 500 });
    }

    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    if (!userCredits.is_pro) {
      await supabase.from('users_credits').update({ credits: userCredits.credits - 1 }).eq('id', userId);
    }

    // --- Gemini Logic ---
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    
    // FIXED: Use the stable Flash model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash', 
      systemInstruction: SYSTEM_PROMPT,
    });

    let prompt = mode === 'solver' ? `[SOLVER MODE] ${text}` : `[TUTOR MODE] ${text}`;
    
    let result;
    if (imageBase64) {
      // Clean Base64 to prevent SDK errors
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      result = await model.generateContent([prompt, { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = await result.response.text();

    return NextResponse.json({
      response: responseText,
      remainingCredits: userCredits.is_pro ? 999 : userCredits.credits - 1,
      isPro: userCredits.is_pro,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}