import { useEffect, useState } from 'react';
import { EVENTS, STORAGE_KEYS } from '../config/storage';

function read(k: string, d: string) {
  try { return localStorage.getItem(k) || d; } catch { return d; }
}
function save(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch {}
}

export default function LangToggle() {
  const [lang, setLang] = useState(() => read(STORAGE_KEYS.consoleLang, 'pt'));

  useEffect(() => {
    save(STORAGE_KEYS.consoleLang, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    // Swap visible text in data-pt / data-en elements
    document.querySelectorAll<HTMLElement>('[data-pt]').forEach(el => {
      const text = lang === 'en' ? el.dataset.en : el.dataset.pt;
      if (text !== undefined) el.innerHTML = text;
    });
    window.dispatchEvent(new CustomEvent(EVENTS.lang, { detail: lang }));
  }, [lang]);

  return (
    <div className="langbar">
      <button
        className={lang === 'pt' ? 'active' : ''}
        onClick={() => setLang('pt')}
        aria-pressed={lang === 'pt'}
      >🇧🇷 PT</button>
      <button
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >🇺🇸 EN</button>
    </div>
  );
}
