import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { convertWavToMp3 } from './src/utils/audioEncoder.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to get GoogleGenAI client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tone descriptions mapping
function buildStylePrompt(
  tone: string,
  customStyle?: string,
  speechRate = 1.0,
  pitch = 'normal',
  language = 'auto'
): string {
  let stylePrompt = '';

  // Multilingual handling
  if (language === 'en' || tone === 'english_casual' || tone === 'english_corporate') {
    if (tone === 'english_corporate') {
      stylePrompt =
        'Speak in pristine, articulate professional English. Polished broadcast tone, confident projection, and authoritative cadence.';
    } else {
      stylePrompt =
        'Speak in natural, fluent, native English. Warm, approachable, engaging, and clear modern conversational delivery.';
    }
  } else if (language === 'fr' || tone === 'french_narrative') {
    stylePrompt =
      'Parler dans un français naturel, fluide et élégant avec une diction soignée, chaleureuse et captivante.';
  } else if (language === 'es') {
    stylePrompt =
      'Hablar en un español neutro, fluido, cálido y dinámico con excelente dicción.';
  } else if (language === 'de') {
    stylePrompt =
      'In fließendem, natürlichem und klarem Deutsch sprechen mit angenehmer Intonation.';
  } else if (language === 'tr') {
    stylePrompt =
      'Akıcı, doğal ve anlaşılır bir Türkçe ile seslendiriniz. Doğru tonlama ve sıcak bir anlatım.';
  } else {
    // Arabic tones (default or specified)
    switch (tone) {
      case 'egyptian_friendly':
        stylePrompt =
          'Speak in authentic, warm, everyday Egyptian Arabic colloquial dialect (باللهجة العامية المصرية الطبيعية). Use natural Egyptian cadence, friendly neighborhood warmth, authentic rhythm, and lifelike expressions.';
        break;
      case 'egyptian_ad':
        stylePrompt =
          'Speak in energetic and persuasive commercial Egyptian Arabic (إعلان تجاري حماسي بالعامية المصرية). Dynamic, charismatic, exciting, and upbeat rhythm with natural Egyptian charisma.';
        break;
      case 'egyptian_story':
        stylePrompt =
          'Speak in evocative Egyptian folklore storytelling tone (حكايات وسوالف مصرية دافئة). Gentle, rhythmic, captivating, and emotionally rich delivery in Egyptian colloquial dialect.';
        break;
      case 'news_anchor':
        stylePrompt =
          'Speak in formal Classical Arabic (فصحى إخبارية رصينة ومتقنة). Flawless diacritics (تشكيل دقيق), dignified, authoritative, clear diction, and standard broadcast journalist cadence.';
        break;
      case 'documentary':
        stylePrompt =
          'Speak in grand, cinematic Classical Arabic documentary style (وثائقي فصيح مهيب). Deep, reflective, immersive, measured, and solemn pacing.';
        break;
      case 'storytelling':
        stylePrompt =
          'Speak in warm, soothing Arabic audiobook storytelling tone (راوٍ قصصي دافئ ومعبر). Expressive, comforting, gentle pauses, clear pronunciation with full emotion.';
        break;
      case 'motivational':
        stylePrompt =
          'Speak in inspiring, passionate Arabic motivational tone (خطاب تحفيزي قوي وملهم). Clear, confident projection, powerful emphasis, and uplifting energy.';
        break;
      case 'educational':
        stylePrompt =
          'Speak in clear, patient Arabic educational lecturing tone (شرح تعليمي مبسط وهادئ). Clear pronunciation, thoughtful pacing, pedagogical clarity, and accessible articulation.';
        break;
      default:
        stylePrompt = customStyle ||
          'Speak naturally in clear, human, expressive voice with authentic tone and proper intonation suited to the detected language.';
    }
  }

  // Adjust tempo/speed instructions
  if (speechRate < 0.85) {
    stylePrompt += ' Deliver the speech at a deliberate, slow, and measured tempo.';
  } else if (speechRate > 1.2) {
    stylePrompt += ' Deliver the speech at a brisk, energetic, and rapid tempo.';
  }

  // Adjust pitch/timbre instructions
  if (pitch === 'deep') {
    stylePrompt += ' Resonant, deep, warm baritone chest voice timbre.';
  } else if (pitch === 'bright') {
    stylePrompt += ' Bright, crisp, higher-pitched, clear vocal timbre.';
  }

  return stylePrompt;
}

// 1. Endpoint: TTS Synthesis
app.post('/api/tts/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      text,
      voiceName = 'Kore',
      tone = 'egyptian_friendly',
      language = 'auto',
      customStyle,
      speechRate = 1.0,
      pitch = 'normal',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required for TTS generation.' });
      return;
    }

    const ai = getAIClient();
    const stylePrompt = buildStylePrompt(
      tone,
      customStyle,
      Number(speechRate),
      String(pitch),
      String(language)
    );

    // Valid Gemini TTS voice names: Puck, Charon, Kore, Fenrir, Zephyr
    const validVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

    let response: any = null;

    // Helper to call a specific Gemini TTS model
    const callTTSModel = async (modelName: string) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });
    };

    // Primary: Try gemini-3.8-flash-tts (high quality & independent quota pool)
    try {
      response = await callTTSModel('gemini-3.8-flash-tts');
    } catch (primaryErr: any) {
      console.warn('gemini-3.8-flash-tts attempt ended, attempting gemini-3.8-flash-lite-tts...');
      // Secondary: Try gemini-3.8-flash-lite-tts
      try {
        response = await callTTSModel('gemini-3.8-flash-lite-tts');
      } catch (secondaryErr: any) {
        console.warn('Both Gemini TTS cloud models reached limit:', secondaryErr?.message);
        res.json({
          success: false,
          quotaExceeded: true,
          error: 'QUOTA_EXCEEDED',
          message:
            'تم استهلاك الحصة اليومية المجانية المتاحة لنماذج Gemini TTS (10 طلبات يومياً على الحساب المجاني).',
        });
        return;
      }
    }

    const base64Wav = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Wav) {
      res.status(502).json({
        error: 'لم تتم استعادة أي بيانات صوتية من محرك التوليد.',
      });
      return;
    }

    const wavBuffer = Buffer.from(base64Wav, 'base64');

    // Encode to MP3 using our lamejs wrapper
    let base64Mp3 = '';
    let mp3Size = 0;
    try {
      const mp3Buffer = convertWavToMp3(wavBuffer, 128);
      base64Mp3 = mp3Buffer.toString('base64');
      mp3Size = mp3Buffer.length;
    } catch (mp3Err) {
      console.warn('MP3 conversion fallback:', mp3Err);
    }

    res.json({
      success: true,
      wavBase64: base64Wav,
      mp3Base64: base64Mp3,
      mimeTypeWav: 'audio/wav',
      mimeTypeMp3: 'audio/mp3',
      sizeWav: wavBuffer.length,
      sizeMp3: mp3Size,
      voice: chosenVoice,
      tone,
      speechRate,
      pitch,
      stylePrompt,
    });
  } catch (err: any) {
    console.error('Error in /api/tts/generate:', err);
    const errStr = (err?.message || '') + JSON.stringify(err || '');
    if (
      errStr.includes('429') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('Quota exceeded')
    ) {
      res.json({
        success: false,
        quotaExceeded: true,
        error: 'QUOTA_EXCEEDED',
        message:
          'تم استهلاك الحصة اليومية المجانية لنموذج Gemini TTS (10 طلبات في اليوم للحساب المجاني).',
      });
      return;
    }

    res.status(500).json({
      error: 'حدث خطأ مؤقت في الاتصال بخدمة التوليد الصوتي.',
    });
  }
});

// 2. Endpoint: Arabic Text Assistant (Tashkeel / Egyptian Dialect / Tone Suggestion)
app.post('/api/text/assist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    const ai = getAIClient();
    let prompt = '';

    if (action === 'tashkeel') {
      prompt = `أنت خبير لغوي في اللغة العربية والنحو والصرف.
قم بإضافة التشكيل الكامل الدقيق (الحركات الإعرابية: الفتحة، الضمة، الكسرة، السكون، التنوين، الشدة) إلى النص التالي بدون تغيير أي كلمة وبدون كتابة أي مقدمات أو شروحات. أعد النص المشكّل فقط:
"${text.trim()}"`;
    } else if (action === 'to_egyptian') {
      prompt = `أنت كاتب ومؤلف محتوى مصري محترف.
قم بإعادة صياغة النص التالي إلى اللهجة العامية المصرية الطبيعية الدارجة والمحبوبة (بأسلوب مصري أصيل وسلس مثل حوارات الشارع والدراما المصرية الراقية)، مع الحفاظ على المعنى الأساسي تماماً. لا تضف أي مقدمة أو خاتمة، فقط النص بالعامية المصرية:
"${text.trim()}"`;
    } else if (action === 'to_formal') {
      prompt = `قم بتحويل النص التالي إلى لغة عربية فصحى بليغة ومشكلة تشكيلاً كاملاً ودقيقاً:
"${text.trim()}"`;
    } else if (action === 'suggest_tone') {
      prompt = `حلل النص التالي واقترح أفضل إعدادات للصوت بنظام JSON فقط بالشكل التالي:
{
  "recommendedVoice": "Kore" or "Fenrir" or "Puck" or "Charon" or "Zephyr",
  "recommendedTone": "egyptian_friendly" or "egyptian_ad" or "egyptian_story" or "news_anchor" or "documentary" or "storytelling" or "motivational" or "educational",
  "recommendedRate": 1.0,
  "recommendedPitch": "normal" or "deep" or "bright",
  "reason": "سبب التوصية باختصار"
}

النص:
"${text.trim()}"`;
    } else {
      res.status(400).json({ error: 'Invalid action.' });
      return;
    }

    let resultText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      resultText = response.text?.trim() || '';
    } catch (apiErr: any) {
      console.warn('Gemini text assistant API notice, activating local smart fallback:', apiErr?.message);
      if (action === 'to_egyptian') {
        // Smart colloquial Egyptian vocabulary mapper
        const converted = text
          .replace(/\bهذا\b/g, 'ده')
          .replace(/\bهذه\b/g, 'دي')
          .replace(/\bهؤلاء\b/g, 'دول')
          .replace(/\bماذا\b/g, 'إيه')
          .replace(/\bلماذا\b/g, 'ليه')
          .replace(/\bكيف\b/g, 'إزاي')
          .replace(/\bأين\b/g, 'فين')
          .replace(/\bمتى\b/g, 'إمتى')
          .replace(/\bالآن\b/g, 'دلوقتي')
          .replace(/\bكثيراً\b/g, 'أوي')
          .replace(/\bجداً\b/g, 'خالص')
          .replace(/\bنعم\b/g, 'أيوه')
          .replace(/\bلا أعلم\b/g, 'معرفش')
          .replace(/\bأريد\b/g, 'عايز')
          .replace(/\bنريد\b/g, 'عايزين')
          .replace(/\bفقط\b/g, 'بس')
          .replace(/\bسوف\b/g, 'هـ')
          .replace(/\bأيضاً\b/g, 'كمان')
          .replace(/\bلكن\b/g, 'بس');
        res.json({
          success: true,
          result: converted,
          fallback: true,
        });
        return;
      } else if (action === 'suggest_tone') {
        const isEgyptian = text.includes('ده') || text.includes('إيه') || text.includes('أوي') || text.includes('يا') || text.includes('مصر');
        res.json({
          success: true,
          suggestion: {
            recommendedVoice: isEgyptian ? 'Kore' : 'Fenrir',
            recommendedTone: isEgyptian ? 'egyptian_friendly' : 'news_anchor',
            recommendedRate: 1.0,
            recommendedPitch: 'normal',
            reason: isEgyptian
              ? 'تم اختيار نبرة عامية مصرية ودية تناسب العبارات الحوارية اليومية'
              : 'تم اختيار نبرة فصحى رصينة تناسب سياق النص المكتوب',
          },
          fallback: true,
        });
        return;
      } else {
        // Tashkeel fallback
        res.json({
          success: true,
          result: text,
          notice: 'تم استخدام النص مباشرة نظراً لاستهلاك الحصة اليومية المؤقتة.',
          fallback: true,
        });
        return;
      }
    }

    if (action === 'suggest_tone') {
      try {
        const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json({ success: true, suggestion: parsed });
        return;
      } catch {
        res.json({ success: true, raw: resultText });
        return;
      }
    }

    res.json({
      success: true,
      result: resultText,
    });
  } catch (err: any) {
    console.error('Error in /api/text/assist:', err);
    res.json({
      success: false,
      error: 'تعذر إتمام المساعدة اللغوية في الوقت الحالي، يرجى المحاولة لاحقاً.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
