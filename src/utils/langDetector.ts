import { LanguageId } from '../types.ts';

export interface DetectionResult {
  lang: LanguageId;
  nameAr: string;
  flag: string;
  confidence: 'high' | 'medium';
}

/**
 * Fast client-side language detection
 */
export function detectLanguageFromText(text: string): DetectionResult {
  if (!text || !text.trim()) {
    return { lang: 'ar', nameAr: 'العربية', flag: '🇪🇬', confidence: 'medium' };
  }

  const clean = text.trim();

  // Arabic regex
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const arabicMatches = clean.match(arabicRegex);
  const arabicCount = arabicMatches ? arabicMatches.length : 0;

  // Latin characters
  const latinMatches = clean.match(/[a-zA-Z]/g);
  const latinCount = latinMatches ? latinMatches.length : 0;

  if (arabicCount > latinCount) {
    return { lang: 'ar', nameAr: 'العربية', flag: '🇪🇬', confidence: 'high' };
  }

  // Check French accents & common words
  if (
    /[éàèùâêîôûëïüÿçœæ]/i.test(clean) ||
    /\b(le|la|les|un|une|des|et|est|dans|pour|avec|vous|nous|bonjour|bienvenue|merci)\b/i.test(clean)
  ) {
    return { lang: 'fr', nameAr: 'الفرنسية', flag: '🇫🇷', confidence: 'high' };
  }

  // Check Spanish
  if (
    /[ñ¿¡]/i.test(clean) ||
    /\b(el|la|los|las|un|una|en|por|para|con|hola|gracias|buenos|días|bienvenido)\b/i.test(clean)
  ) {
    return { lang: 'es', nameAr: 'الإسبانية', flag: '🇪🇸', confidence: 'high' };
  }

  // Check German
  if (
    /[äöüß]/i.test(clean) ||
    /\b(der|die|das|und|ist|nicht|mit|für|hallo|willkommen|danke)\b/i.test(clean)
  ) {
    return { lang: 'de', nameAr: 'الألمانية', flag: '🇩🇪', confidence: 'high' };
  }

  // Check Turkish
  if (
    /[ğüşöçıİ]/i.test(clean) ||
    /\b(bir|ve|ile|için|merhaba|teşekkürler|günaydın)\b/i.test(clean)
  ) {
    return { lang: 'tr', nameAr: 'التركية', flag: '🇹🇷', confidence: 'high' };
  }

  // Default Latin -> English
  if (latinCount > 0) {
    return { lang: 'en', nameAr: 'الإنجليزية', flag: '🇺🇸', confidence: 'high' };
  }

  return { lang: 'ar', nameAr: 'العربية', flag: '🇪🇬', confidence: 'medium' };
}
