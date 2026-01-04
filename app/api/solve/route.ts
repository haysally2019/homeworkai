import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are ALTUS, a University Verification Engine.
MODES:
- [SOLVER MODE]: Solve the problem. You MUST SIMULATE Python code execution for any math/science problem to ensure accuracy. Output the final answer in LaTeX ($...$).
- [TUTOR MODE]: Do NOT give the answer. Identify the first step and ask a guiding question.`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, mode, userId, context } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

    // --- CREDITS CHECK (Keep your existing logic here) ---
    const { data: userCredits, error: fetchError } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !userCredits) {
        // ... (Keep your existing error handling / creation logic)
        // For brevity, I'm skipping the duplicate lines, keep your original DB logic.
        return NextResponse.json({ error: 'Database error or user not found' }, { status: 500 });
    }

    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade to Pro.' },
        { status: 402 }
      );
    }

    if (!userCredits.is_pro) {
      await supabase
        .from('users_credits')
        .update({ credits: userCredits.credits - 1 })
        .eq('id', userId);
    }
    // -----------------------------------------------------

    // 1. USE THE STRONGEST THINKING MODEL
    // 'gemini-2.0-flash-thinking-exp' always points to the latest, strongest version.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp', 
      systemInstruction: SYSTEM_PROMPT,
    });

    let contextPrompt = '';
    if (context && context.length > 0) {
      contextPrompt = '\n\nPrevious conversation:\n' +
        context.slice(-10).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') +
        '\n\nCurrent question:\n';
    }

    let prompt = mode === 'solver' 
      ? `[SOLVER MODE]${contextPrompt} ${text}`
      : `[TUTOR MODE]${contextPrompt} ${text}`;

    let result;

    if (imageBase64) {
      // 2. CLEAN BASE64 STRING (Fixes common "Invalid Argument" errors)
      // Sometimes the header is repeated or malformed.
      const base64Data = imageBase64.includes(',') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg', // Force JPEG if unsure, or extract dynamically
        },
      };

      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const responseText = response.text(); 

    return NextResponse.json({
      response: responseText,
      remainingCredits: userCredits.is_pro ? 999 : userCredits.credits - 1,
      isPro: userCredits.is_pro,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}