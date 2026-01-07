import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are ALTUS, an advanced Academic AI Assistant.

CORE PROTOCOLS:
1. **Solver Mode:** Provide direct, step-by-step solutions. Use LaTeX for math ($x^2$).
2. **Tutor Mode:** Ask guiding questions. Do not give the answer immediately.
3. **Note Taker Mode:** Format raw notes into strict Markdown. Ignore conversational filler.
4. **Lecture Mode:** Listen to the audio transcript. Extract key points, definitions, and deadlines.
5. **Roast Mode:** You are a harsh but fair professor. 
   - First, give a LETTER GRADE (A-F).
   - Second, ROAST the writing style, logic, and effort. Be witty, sarcastic, and funny. (e.g., "This essay has more fluff than a pillow factory.")
   - Third, provide 3 specific, actionable improvements to raise the grade.

FORMATTING:
- Math: Use LaTeX wrapped in $ or $$.
- Text: Use standard Markdown.`;

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64, audioBase64, mode, userId, context, stream } = await request.json();

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
      const { data: newCredits } = await supabase
        .from('users_credits')
        .insert({ id: userId, credits: 5, is_pro: false })
        .select()
        .single();
      userCredits = newCredits;
    }

    if (!userCredits.is_pro && userCredits.credits < 1) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 402 });
    }

    // 2. Initialize Gemini 2.0
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', 
      systemInstruction: SYSTEM_PROMPT 
    });

    let prompt = mode === 'solver' ? `[SOLVER TASK]\n${text}` : `[TUTOR TASK]\n${text}`;
    if (mode === 'roast') prompt = `[ROAST MY ESSAY]\n${text}`; // Explicit roast trigger
    
    if (context) prompt += `\n\nCONTEXT:\n${context}`;

    const parts: any[] = [prompt];
    
    if (imageBase64) {
      const cleanImage = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({ inlineData: { data: cleanImage, mimeType: 'image/jpeg' } });
    }

    if (audioBase64) {
      const cleanAudio = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      parts.push({ inlineData: { data: cleanAudio, mimeType: 'audio/mp3' } });
    }

    // 3. Deduct Credit (Optimistic)
    if (!userCredits.is_pro) {
      await supabase.from('users_credits').update({ credits: userCredits.credits - 1 }).eq('id', userId);
    }
    const remaining = userCredits.is_pro ? 'Unlimited' : (userCredits.credits - 1).toString();

    // 4. Handle STREAMING Request
    if (stream) {
      const result = await model.generateContentStream(parts);
      const encoder = new TextEncoder();
      
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Remaining-Credits': remaining,
          'X-Is-Pro': userCredits.is_pro.toString()
        },
      });
    }

    const result = await model.generateContent(parts);
    return NextResponse.json({
      response: result.response.text(),
      remainingCredits: userCredits.is_pro ? 999 : userCredits.credits - 1,
      isPro: userCredits.is_pro,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}