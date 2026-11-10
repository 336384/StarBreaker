import { LANGUAGES, setLanguage, useLanguage, useT } from "../i18n";

/**
 * Language picker. Rendered in the sidebar (below the mode list) and on the
 * startup screen (top-right corner) so the UI can be switched before a P4k is
 * opened. The choice is persisted by the i18n store and applies immediately:
 * every component using `useT()` re-renders.
 */
export function LanguageSwitcher({ floating = false }: { floating?: boolean }) {
  const t = useT();
  const language = useLanguage();

  return (
    <div
      className={
        floating
          ? "absolute top-3 right-3 flex items-center gap-1 rounded-md border border-border bg-bg-alt/80 px-1 py-1 backdrop-blur-sm"
          : "flex items-center gap-1 rounded-md border border-border bg-surface/60 px-1 py-1"
      }
      role="group"
      aria-label={t("Language")}
      title={t("Language")}
    >
      {LANGUAGES.map((option) => {
        const active = option.id === language;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLanguage(option.id)}
            aria-pressed={active}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              active
                ? "bg-primary/20 text-text"
                : "text-text-dim hover:text-text hover:bg-surface-hi"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
