import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";

const translations: Record<string, any> = {
  FR: {
    welcome: "Bienvenue sur",
    subtitle: "L'État à portée de main.",
    slogan: "Rapide. Inclusif. Digital.",
    btnPortal: "Accès Portail",
    btnDiscover: "Découvrir",
    protocols: "Protocoles d'Accès",
    p1Title: "S'informer",
    p1Desc: "Flux d'actualités et annuaire ministériel ouvert.",
    p2Title: "S'identifier",
    p2Desc: "Authentification biométrique ou par code CNI/OTP.",
    p3Title: "Soumettre",
    p3Desc: "Dépôt dématérialisé et suivi algorithmique.",
    p4Title: "Assistance IA",
    p4Desc: "Support vocal, synthèse et interprétation des signes.",
    init: "Initialiser",
    trackTitle: "Suivi & Localisation",
    trackDesc: "Suivez votre dossier ou localisez un point de service physique.",
    contactTitle: "Annuaire & Contacts",
    contactDesc: "Trouvez facilement les contacts des différents services de l'État."
  },
  EN: {
    welcome: "Welcome to",
    subtitle: "The State at your fingertips.",
    slogan: "Fast. Inclusive. Digital.",
    btnPortal: "Portal Access",
    btnDiscover: "Discover",
    protocols: "Access Protocols",
    p1Title: "Stay Informed",
    p1Desc: "Open news feed and ministerial directory.",
    p2Title: "Identify",
    p2Desc: "Biometric or CNI/OTP authentication.",
    p3Title: "Submit",
    p3Desc: "Paperless submission and algorithmic tracking.",
    p4Title: "AI Assistance",
    p4Desc: "Voice support, synthesis, and sign language interpretation.",
    init: "Initialize",
    trackTitle: "Tracking & Location",
    trackDesc: "Track your case or locate a physical service point.",
    contactTitle: "Directory & Contacts",
    contactDesc: "Easily find contacts for various state services."
  },
  AR: {
    welcome: "مرحباً بكم في",
    subtitle: "الدولة في متناول يدك.",
    slogan: "سريع. شامل. رقمي.",
    btnPortal: "دخول البوابة",
    btnDiscover: "اكتشف",
    protocols: "بروتوكولات الوصول",
    p1Title: "استعلم",
    p1Desc: "موجز الأخبار ودليل الوزارات المفتوح.",
    p2Title: "تحديد الهوية",
    p2Desc: "المصادقة البيومترية أو عبر رقم البطاقة الوطنية/كلمة المرور لمرة واحدة.",
    p3Title: "تقديم",
    p3Desc: "إيداع رقمي وتتبع خوارزمي.",
    p4Title: "مساعدة الذكاء الاصطناعي",
    p4Desc: "دعم صوتي، تركيب وتفسير لغة الإشارة.",
    init: "تهيئة",
    trackTitle: "التتبع وتحديد الموقع",
    trackDesc: "تتبع ملفك أو حدد موقع نقطة خدمة فعلية.",
    contactTitle: "الدليل وجهات الاتصال",
    contactDesc: "اعثر بسهولة على جهات الاتصال لمختلف خدمات الدولة."
  },
  TAM: {
    welcome: "ⴰⵙⵏⵓⴱⴳ ⵖⵔ",
    subtitle: "ⴰⵡⴰⵏⴽ ⴳ ⵓⴼⵓⵙ ⵏⵏⴽ.",
    slogan: "ⵉⵖⴰⵡⵍ. ⵉⵙⵎⵓⵏ. ⴰⵎⵓⵟⵟⵓⵏ.",
    btnPortal: "ⴰⴽⵛⵛⵓⵎ ⵖⵔ ⵜⴰⴼⵍⵡⵉⵜ",
    btnDiscover: "ⵙⵏⵓⴱⴳ",
    protocols: "ⵉⴱⵔⵉⴷⵏ ⵏ ⵓⴽⵛⵛⵓⵎ",
    p1Title: "ⵉⵏⵖⵎⵉⵙⵏ",
    p1Desc: "ⴰⵖⴱⴰⵍⵓ ⵏ ⵉⵏⵖⵎⵉⵙⵏ ⴷ ⵓⵎⴰⵡⴰⵍ ⵏ ⵜⵎⴰⵡⴰⵙⵉⵏ.",
    p2Title: "ⴰⵙⵎⴰⵇⵇⵍ",
    p2Desc: "ⴰⵙⵙⵉⴷⵢ ⵙ ⵜⴱⴰⵢⵓⵎⵉⵜⵔⵉⵜ ⵏⵖ ⵙ ⵓⵟⵟⵓⵏ ⵏ ⵜⴽⴰⵕⴹⴰ ⵏ ⵜⵎⴰⴳⵉⵜ/OTP.",
    p3Title: "ⴰⵙⵔⵙ",
    p3Desc: "ⴰⵙⵔⵙ ⴰⵎⵓⵟⵟⵓⵏ ⴷ ⵓⴹⴼⵓⵕ ⴰⵍⴳⵓⵔⵉⵜⵎⵉ.",
    p4Title: "ⵜⵉⵡⵉⵙⵉ ⵏ IA",
    p4Desc: "ⵜⵉⵡⵉⵙⵉ ⵙ ⵉⵎⵙⵍⵉ, ⴰⵙⵉⵙⵍ ⴷ ⵓⵙⵓⵖⵍ ⵏ ⵜⵎⴰⵜⴰⵔⵉⵏ.",
    init: "ⵙⵙⵏⵜⵉ",
    trackTitle: "ⴰⴹⴼⵓⵕ ⴷ ⵓⵙⵉⴷⴳ",
    trackDesc: "ⴹⴼⵓⵕ ⴰⴼⴰⵢⵍⵓ ⵏⵏⴽ ⵏⵖ ⴰⴼ ⵢⴰⵏ ⵓⵎⴽⴰⵏ ⵏ ⵜⵏⴰⴼⵓⵜ.",
    contactTitle: "ⴰⵎⴰⵡⴰⵍ ⴷ ⵉⵏⵎⵉⵇⵇⴰⵔⵏ",
    contactDesc: "ⴰⴼ ⵙ ⵜⵙⵓⵍⴼⵜ ⵉⵏⵎⵉⵇⵇⴰⵔⵏ ⵏ ⵜⵏⴰⴼⵓⵜⵉⵏ ⵏ ⵓⵡⴰⵏⴽ."
  }
};

export function HomePage() {
  const { lang } = useUIStore();
  const t = translations[lang] || translations.FR;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="space-y-24 py-12" dir={lang === "AR" ? "rtl" : "ltr"}>
      {/* Héro Section 2050 Style avec Animations */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-[60vh] flex flex-col items-center justify-start pt-16 text-center max-w-7xl mx-auto px-4 bg-cover bg-center bg-no-repeat rounded-[3rem] overflow-hidden"
        style={{ backgroundImage: "url('/karam.png')" }}
      >
        {/* Cercles Flottants Animés (Décoration) */}
        <motion.div
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-64 h-64 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-20 w-80 h-80 bg-primary/10 blur-[80px] rounded-full pointer-events-none"
        />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-5xl mx-auto mb-10 shadow-2xl border border-white/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
            T
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-primary to-cyan-600 tracking-tighter mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.9)]"
          >
            Tawsa
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-800 font-bold tracking-wide max-w-2xl mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          >
            {t.subtitle} <br/>
            <span className="font-extrabold text-primary drop-shadow-md">{t.slogan}</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
          >
            <Link to="/login" className="px-10 py-4 rounded-full bg-slate-900 text-white font-bold tracking-widest text-sm uppercase transition-all duration-300 hover:bg-primary hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1">
              {t.btnPortal}
            </Link>
            <Link to="/actualites" className="px-10 py-4 rounded-full bg-white text-slate-900 font-bold tracking-widest text-sm uppercase transition-all duration-300 border border-slate-200 hover:border-primary hover:text-primary hover:shadow-lg hover:-translate-y-1">
              {t.btnDiscover}
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Protocoles d'Accès avec Animations minimalistes */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="max-w-6xl mx-auto relative z-10 px-4"
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{t.protocols}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-8" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { link: "/actualites", bg: "/s'informer.png" },
            { link: "/login", bg: "/s'identifier.png" },
            { link: "/suivi", bg: "/soumettre.png" },
            { link: "#", bg: "/assistance iA.png" }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="group relative aspect-[4/3] rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 overflow-hidden bg-cover bg-center flex flex-col justify-end p-6 border border-slate-200"
              style={{ backgroundImage: `url("${item.bg}")` }}
            >
              {/* Overlay léger pour que le bouton soit visible si l'image est claire en bas */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {item.link !== "#" && (
                <Link to={item.link} className="relative z-10 self-center w-full justify-center inline-flex items-center px-5 py-3 bg-white/95 backdrop-blur-md rounded-xl text-sm font-black uppercase tracking-widest text-slate-900 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:bg-primary hover:text-white transition-colors">
                  {t.init} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Navigation Rapide */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto"
      >
        <motion.div variants={itemVariants}>
          <Link to="/suivi" 
                className="group relative flex items-center p-8 rounded-3xl overflow-hidden border border-white/20 shadow-xl hover:border-cyan-400 transition-all duration-500 bg-cover bg-center"
                style={{ backgroundImage: "url('/localisation.png')" }}>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-0" />
            
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-cyan-900/90 backdrop-blur-md flex items-center justify-center text-3xl mr-6 border border-cyan-400/50 group-hover:scale-110 transition-transform">
              📍
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">{t.trackTitle}</h2>
              <p className="text-white font-bold drop-shadow-md">{t.trackDesc}</p>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/contacts" 
                className="group relative flex items-center p-8 rounded-3xl overflow-hidden border border-white/20 shadow-xl hover:border-purple-400 transition-all duration-500 bg-cover bg-center"
                style={{ backgroundImage: "url('/contact.png')" }}>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-0" />
            
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-purple-900/90 backdrop-blur-md flex items-center justify-center text-3xl mr-6 border border-purple-400/50 group-hover:scale-110 transition-transform">
              📞
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">{t.contactTitle}</h2>
              <p className="text-white font-bold drop-shadow-md">{t.contactDesc}</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
