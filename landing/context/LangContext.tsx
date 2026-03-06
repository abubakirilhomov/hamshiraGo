"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Lang, Translations } from "@/i18n/translations";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  t: translations.ru,
});

export function LangProvider({ children, initialLang = "ru" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
