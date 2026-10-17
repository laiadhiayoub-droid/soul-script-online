import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = [
  { id: "ar", label: "العربية", dir: "rtl" },
  { id: "es", label: "Español", dir: "ltr" },
  { id: "en", label: "English", dir: "ltr" },
  { id: "fr", label: "Français", dir: "ltr" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];

const STRINGS = {
  appTitle: { ar: "المكتبة الرقمية المدرسية", es: "Biblioteca Escolar Digital", en: "School Digital Library", fr: "Bibliothèque Scolaire Numérique" },
  home: { ar: "الرئيسية", es: "Inicio", en: "Home", fr: "Accueil" },
  summaries: { ar: "الملخصات", es: "Resúmenes", en: "Summaries", fr: "Résumés" },
  favorites: { ar: "مفضلاتي", es: "Mis favoritos", en: "My favourites", fr: "Mes favoris" },
  filter: { ar: "تصفية", es: "Filtrar", en: "Filter", fr: "Filtrer" },
  books: { ar: "كراريس القسم", es: "Cuadernos de la clase", en: "Class notebooks", fr: "Cahiers de la classe" },
  addLesson: { ar: "إضافة درس", es: "Añadir lección", en: "Add lesson", fr: "Ajouter une leçon" },
  addSummary: { ar: "إضافة ملخص", es: "Añadir resumen", en: "Add summary", fr: "Ajouter un résumé" },
  dashboard: { ar: "لوحة التحكم", es: "Panel", en: "Dashboard", fr: "Tableau de bord" },
  signIn: { ar: "تسجيل الدخول باستخدام Google", es: "Entrar con Google", en: "Sign in with Google", fr: "Se connecter avec Google" },
  signInShort: { ar: "دخول Google", es: "Google", en: "Google", fr: "Google" },
  signOut: { ar: "تسجيل الخروج", es: "Cerrar sesión", en: "Sign out", fr: "Se déconnecter" },
  menu: { ar: "القائمة", es: "Menú", en: "Menu", fr: "Menu" },
  theme: { ar: "الوضع الليلي", es: "Modo oscuro", en: "Dark mode", fr: "Mode sombre" },
  language: { ar: "اللغة", es: "Idioma", en: "Language", fr: "Langue" },
} satisfies Record<string, Record<Lang, string>>;
export type StringKey = keyof typeof STRINGS;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: StringKey) => string }>({
  lang: "ar", setLang: () => {}, t: (k) => STRINGS[k].ar,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && LANGS.some((l) => l.id === saved)) setLangState(saved);
  }, []);
  useEffect(() => {
    const def = LANGS.find((l) => l.id === lang)!;
    document.documentElement.lang = lang;
    document.documentElement.dir = def.dir;
  }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem("lang", l); setLangState(l); };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => STRINGS[k][lang] }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
