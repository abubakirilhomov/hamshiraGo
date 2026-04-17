import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as ruMessages from './ru.json';
import * as uzMessages from './uz.json';

type Lang = 'ru' | 'uz';

const translations: Record<Lang, Record<string, string>> = {
  ru: ruMessages as Record<string, string>,
  uz: uzMessages as Record<string, string>,
};

@Injectable()
export class I18nService {
  /** Translate an error key to the target language. Returns the key itself if not found. */
  t(key: string, lang: Lang = 'ru'): string {
    return translations[lang]?.[key] ?? translations.ru[key] ?? key;
  }

  /** Extract preferred language from request Accept-Language header. */
  getLang(req: Request): Lang {
    const header = req.headers['accept-language'];
    if (!header) return 'ru';
    const first = String(header).split(',')[0].trim().toLowerCase();
    if (first.startsWith('uz')) return 'uz';
    return 'ru';
  }
}
