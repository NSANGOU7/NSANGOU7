import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGS } from '../../contexts/LanguageContext';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  const handleSelect = (code) => {
    setLang(code);
    setOpen(false);
  };

  const isCompact = variant === 'compact';

  return (
    <div className="relative" data-testid="language-switcher">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-50 transition-colors ${
          isCompact ? 'text-xs' : 'text-sm'
        }`}
        aria-label="Changer la langue"
        data-testid="language-switcher-trigger"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-medium uppercase">{current.code}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-lg rounded min-w-[160px] z-50 py-1"
            data-testid="language-switcher-menu"
          >
            {SUPPORTED_LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                  lang === l.code ? 'font-semibold bg-slate-50' : ''
                }`}
                data-testid={`language-option-${l.code}`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {lang === l.code && <Check size={14} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
