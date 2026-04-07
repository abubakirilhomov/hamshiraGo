import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n, { DEFAULT_LANGUAGE, Language } from '@/i18n';
import { setApiLanguage } from '@/constants/api';

const LANGUAGE_KEY = 'app_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  /** true once the stored value has been read from SecureStore */
  isLoaded: boolean;
  /** true on the very first launch when no language has been saved yet */
  isFirstLaunch: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => {},
  isLoaded: false,
  isFirstLaunch: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY)
      .then((stored) => {
        if (stored === 'ru' || stored === 'uz') {
          setLanguageState(stored);
          i18n.changeLanguage(stored);
          setApiLanguage(stored);
          setIsFirstLaunch(false);
        } else {
          setIsFirstLaunch(true);
        }
      })
      .catch(() => {
        setIsFirstLaunch(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setIsFirstLaunch(false);
    setApiLanguage(lang);
    await i18n.changeLanguage(lang);
    await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoaded, isFirstLaunch }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
