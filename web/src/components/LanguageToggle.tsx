import { useLocale, type Locale } from "@/src/i18n";

const options: Locale[] = ["fi", "en"];

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex rounded-lg overflow-hidden border border-border">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setLocale(opt)}
          className={`px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            locale === opt
              ? "bg-accent text-bg-0"
              : "bg-bg-2 text-text-secondary hover:text-text-primary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
