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

    const { data: userCredits, error: fetchError } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Database error: ' + fetchError.message }, { status: 500 });
    }

    if (!userCredits) {
      const { error: insertError } = await supabase
        .from('users_credits')
        .insert({ id: userId, credits: 3, is_pro: false });

      if (insertError) {
        console.error('Failed to create credits:', insertError);
        return NextResponse.json({ error: 'Failed to initialize user credits' }, { status: 500 });
      }

      const { data: newCredits } = await supabase
        .from('users_credits')
        .select('credits, is_pro')
        .eq('id', userId)
        .single();

      if (!newCredits) {
        return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Please try again' }, { status: 500 });
    }

    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade to Pro.' },
        { status: 402 }
      );
    }

    if (!userCredits.is_pro) {
      const { data: updatedCredits, error: updateError } = await supabase
        .from('users_credits')
        .update({ credits: userCredits.credits - 1 })
        .eq('id', userId)
        .select('credits')
        .single();

      if (updateError) {
        console.error('Failed to update credits:', updateError);
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
      }

      userCredits.credits = updatedCredits.credits;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp-1219',
      systemInstruction: SYSTEM_PROMPT,
    });

    let contextPrompt = '';
    if (context && context.length > 0) {
      contextPrompt = '\n\nPrevious conversation:\n' +
        context.slice(-10).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') +
        '\n\nCurrent question:\n';
    }

    let prompt = '';
    if (mode === 'solver') {
      prompt = `[SOLVER MODE]${contextPrompt} ${text}`;
    } else {
      prompt = `[TUTOR MODE]${contextPrompt} ${text}`;
    }

    let result;

    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(',')[0].split(':')[1].split(';')[0];

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };

      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = result.response;
    const responseText = response.text();

    return NextResponse.json({
      response: responseText,
      remainingCredits: userCredits.credits,
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
