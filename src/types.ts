export type VoiceId = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type LanguageId = 'auto' | 'ar' | 'en' | 'fr' | 'es' | 'de' | 'tr';

export type ToneId =
  | 'egyptian_friendly'
  | 'egyptian_ad'
  | 'egyptian_story'
  | 'news_anchor'
  | 'documentary'
  | 'storytelling'
  | 'motivational'
  | 'educational'
  | 'english_casual'
  | 'english_corporate'
  | 'french_narrative';

export type PitchType = 'deep' | 'normal' | 'bright';

export interface LanguageOption {
  id: LanguageId;
  nameAr: string;
  nativeName: string;
  flag: string;
}

export interface VoiceOption {
  id: VoiceId;
  nameAr: string;
  gender: 'female' | 'male';
  title: string;
  description: string;
  color: string;
}

export interface TonePreset {
  id: ToneId;
  title: string;
  category: 'egyptian' | 'classical' | 'multilingual';
  description: string;
  iconName: string;
  sampleText: string;
  lang?: LanguageId;
}

export interface GeneratedSpeechItem {
  id: string;
  text: string;
  voice: VoiceId;
  tone: ToneId;
  language?: LanguageId;
  detectedLang?: string;
  speechRate: number;
  pitch: PitchType;
  wavUrl: string;
  mp3Url?: string;
  wavSize?: number;
  mp3Size?: number;
  createdAt: number;
  duration?: number;
  isDeviceFallback?: boolean;
}
