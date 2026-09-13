import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignLanguageModal } from "../accessibility/SignLanguageModal";
import { VoiceAssistantModal } from "../accessibility/VoiceAssistantModal";
import { EchoTalkSignModal } from "../accessibility/EchoTalkSignModal";
import { CniPhotoModal } from "./CniPhotoModal";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";

export function Navbar() {
  const [isLSMOpen, setIsLSMOpen] = useState(false);
  const [isEchoTalkSignOpen, setIsEchoTalkSignOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isCniOpen, setIsCniOpen] = useState(false);
  const { lang: selectedLang, setLang: setSelectedLang } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const translations: Record<string, Record<string, string>> = {
    FR: { home: "Accueil", news: "Actualités", contact: "Contacts", track: "📍 Suivi & Localisation", deposit: "Déposer", dashboard: "Dashboard", logout: "Déconnexion", login: "Connexion" },
    AR: { home: "الرئيسية", news: "الأخبار", contact: "اتصل بنا", track: "📍 تتبع وتحديد الموقع", deposit: "إيداع", dashboard: "لوحة القيادة", logout: "تسجيل الخروج", login: "تسجيل الدخول" },
    TAM: { home: "ⴰⵙⵏⵓⴱⴳ", news: "ⵉⵏⵖⵎⵉⵙⵏ", contact: "ⴰⵏⵎⵉⵇⵇⴰⵔ", track: "📍 ⴰⴹⴼⵓⵕ ⴷ ⵓⵙⵉⴷⴳ", deposit: "ⴰⵙⵔⵙ", dashboard: "ⵜⴰⴼⵍⵡⵉⵜ ⵏ ⵓⵙⵏⵇⴷ", logout: "ⴰⴼⵓⵖ", login: "ⴰⴽⵛⵛⵓⵎ" },
    EN: { home: "Home", news: "News", contact: "Contact", track: "📍 Tracking & Location", deposit: "Deposit", dashboard: "Dashboard", logout: "Logout", login: "Login" }
  };

  const t = translations[selectedLang] || translations.FR;

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
              T
            </span>
            <span>Tawsa</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <Link to="/" className="hover:text-slate-900 transition px-2 py-1">
              {t.home}
            </Link>
            <Link to="/actualites" className="hover:text-slate-900 transition px-2 py-1">
              {t.news}
            </Link>
            <Link to="/contacts" className="hover:text-slate-900 transition px-2 py-1">
              {t.contact}
            </Link>
            <Link to="/suivi" className="hover:text-slate-900 transition px-2 py-1 font-bold">
              {t.track}
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/depot-demande"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{t.deposit}</span>
                </Link>
                <Link to="/dashboard" className="hover:text-slate-900 transition px-2 py-1">
                  {t.dashboard}
                </Link>

                {/* Avatar / Bouton Photo CNIE Officielle */}
                <button
                  onClick={() => setIsCniOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 text-xs font-semibold transition shadow-sm cursor-pointer"
                  title="Photo CNIE Officielle"
                >
                  {user.cniPhotoUrl ? (
                    <img src={user.cniPhotoUrl} alt="CNIE" className="w-5 h-5 rounded-full object-cover border border-emerald-500" />
                  ) : (
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  <span>{user.cniPhotoUrl ? "Photo CNIE (Validée)" : "Photo CNIE"}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="hover:text-red-600 transition px-2 py-1 cursor-pointer text-xs font-semibold"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-slate-900 transition px-2 py-1 font-bold">
                {t.login}
              </Link>
            )}

            {/* Sélecteur de langue */}
            <div className="relative group ml-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition cursor-pointer">
                <span>{selectedLang}</span>
                <span className="text-[10px]">▼</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 shadow-lg rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col gap-0.5">
                <button onClick={() => setSelectedLang("FR")} className={`text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition ${selectedLang === "FR" ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}>Français (FR)</button>
                <button onClick={() => setSelectedLang("AR")} className={`text-left px-3 py-2 text-xs font-semibold rounded-lg transition ${selectedLang === "AR" ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}>العربية (AR)</button>
                <button onClick={() => setSelectedLang("TAM")} className={`text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition font-sans ${selectedLang === "TAM" ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}>ⵜⴰⵎⴰⵣⵉⵖⵜ (TAM)</button>
                <button onClick={() => setSelectedLang("EN")} className={`text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition ${selectedLang === "EN" ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}>English (EN)</button>
              </div>
            </div>

            {/* Bouton d'accessibilité Avatar Traducteur visible pour TOUS les utilisateurs */}
            <button
              onClick={() => setIsEchoTalkSignOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 text-xs font-black shadow-md hover:scale-105 transition duration-200 cursor-pointer border border-amber-300 ring-2 ring-amber-400/30 ml-2"
              title="Echo 1.0 TalkSign : Avatar 3D Traducteur de Documents"
            >
              <span className="text-sm">🤟</span>
              <span>Echo 1.0 TalkSign</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => setIsVoiceOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-white transition cursor-pointer ml-1"
                  title="Accessibilité : Assistant Vocal"
                >
                  <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Vocal</span>
                </button>

                <button
                  onClick={() => setIsLSMOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-white transition cursor-pointer"
                  title="Accessibilité : Langue des Signes"
                >
                  <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Signes</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* BOUTON FLOTTANT PERMANENT (Visible pour TOUS les visiteurs) */}
      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsEchoTalkSignOpen(true)}
          className="bg-gradient-to-tr from-[#cda351] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-3 rounded-2xl font-black text-xs shadow-2xl border-2 border-amber-300 flex items-center gap-2.5 transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">🤟</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-900/80 leading-none">Accessibilité IA</span>
            <span className="font-extrabold text-xs text-slate-950">Avatar Echo 1.0 TalkSign</span>
          </div>
        </button>
      </div>

      {/* Modals */}
      <SignLanguageModal
        isOpen={isLSMOpen}
        onClose={() => setIsLSMOpen(false)}
      />

      <EchoTalkSignModal
        isOpen={isEchoTalkSignOpen}
        onClose={() => setIsEchoTalkSignOpen(false)}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      <CniPhotoModal
        isOpen={isCniOpen}
        onClose={() => setIsCniOpen(false)}
      />
    </>
  );
}
