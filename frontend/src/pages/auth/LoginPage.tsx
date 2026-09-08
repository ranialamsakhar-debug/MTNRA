import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, ROLE_PROFILES } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";

const translations: Record<string, any> = {
  FR: {
    title: "Espace Sécurisé",
    subtitle: "Authentification via Identité Numérique",
    roleLabel: "Sélectionnez votre Rôle / Acteur :",
    citizen: "Citoyen(ne)",
    agentRec: "Agent Réclamation & Orientation",
    agentVal: "Agent Validation & Conformité",
    agentCer: "Agent Certification",
    agentSig: "Agent Signature",
    mediator: "Médiateur Institutionnel",
    manager: "Responsable Service",
    admin: "Administrateur Système",
    emailLabel: "Email Officiel",
    emailPlaceholder: "votre.email@tawsa.ma",
    cniLabel: "Identifiant / N° CNI / Matricule",
    cniPlaceholder: "Ex: AI225 ou MAT-REC-2001",
    btnSending: "Envoi en cours...",
    btnOtp: "Recevoir mon code OTP par SMS",
    verifyOtp: "Vérification Sécurisée",
    otpSent: "Un code à 6 chiffres a été envoyé au compte",
    otpLabel: "Code reçu",
    btnChecking: "Vérification...",
    btnConfirm: "Confirmer l'accès",
    back: "Retour",
    footer: "Tous droits réservés",
    secure: "Plateforme sécurisée par l'État Marocain"
  },
  EN: {
    title: "Secure Area",
    subtitle: "Authentication via Digital Identity",
    roleLabel: "Select your Role / Actor:",
    citizen: "Citizen",
    agentRec: "Complaints & Orientation Agent",
    agentVal: "Validation & Compliance Agent",
    agentCer: "Certification Agent",
    agentSig: "Signature Agent",
    mediator: "Institutional Mediator",
    manager: "Service Manager",
    admin: "System Administrator",
    emailLabel: "Official Email",
    emailPlaceholder: "your.email@tawsa.ma",
    cniLabel: "Identifier / CNI / Badge Number",
    cniPlaceholder: "e.g. AI225 or MAT-REC-2001",
    btnSending: "Sending...",
    btnOtp: "Receive OTP code via SMS",
    verifyOtp: "Secure Verification",
    otpSent: "A 6-digit code has been sent to the account",
    otpLabel: "Code received",
    btnChecking: "Checking...",
    btnConfirm: "Confirm Access",
    back: "Back",
    footer: "All rights reserved",
    secure: "Platform secured by the Moroccan State"
  },
  AR: {
    title: "فضاء آمن",
    subtitle: "المصادقة عبر الهوية الرقمية",
    roleLabel: "اختر صفة الفاعل:",
    citizen: "مواطن(ة)",
    agentRec: "وكيل الشكايات والتوجيه",
    agentVal: "وكيل التحقق والمطابقة",
    agentCer: "وكيل المصادقة",
    agentSig: "وكيل التوقيع",
    mediator: "الوسيط المؤسساتي",
    manager: "رئيس المصلحة",
    admin: "مسؤول النظام",
    emailLabel: "البريد الإلكتروني الرسمي",
    emailPlaceholder: "email@tawsa.ma",
    cniLabel: "رقم البطاقة / المعرف الوظيفي",
    cniPlaceholder: "مثال: RL998877",
    btnSending: "جاري الإرسال...",
    btnOtp: "استلام رمز OTP عبر رسالة",
    verifyOtp: "تحقق آمن",
    otpSent: "تم إرسال رمز من 6 أرقام إلى الحساب",
    otpLabel: "الرمز المستلم",
    btnChecking: "جاري التحقق...",
    btnConfirm: "تأكيد الدخول",
    back: "رجوع",
    footer: "جميع الحقوق محفوظة",
    secure: "منصة مؤمنة من طرف الدولة المغربية"
  },
  TAM: {
    title: "ⴰⵎⴽⴰⵏ ⵉⴼⵔⴳⵏ",
    subtitle: "ⴰⵙⵙⵉⴷⵢ ⵙ ⵜⵎⴰⴳⵉⵜ ⵜⴰⵎⵓⵟⵟⵓⵏⵜ",
    roleLabel: "ⴽⵢⵢⵉⵏ ⴷ :",
    citizen: "ⴰⵏⴰⵎⵓⵔ",
    agentRec: "ⴰⵎⴰⵣⴰⵏ (ⵜⴰⵛⴽⴰⵢⵜ)",
    agentVal: "ⴰⵎⴰⵣⴰⵏ (ⴰⵙⵖⵥⵏ)",
    agentCer: "ⴰⵎⴰⵣⴰⵏ (ⴰⵙⵉⵙⴽⵍ)",
    agentSig: "ⴰⵎⴰⵣⴰⵏ (ⴰⵣⵎⴰⵎ)",
    mediator: "ⴰⵎⵙⴰⵙⴰ",
    manager: "ⴰⵎⵙⵜⴳⴳⴰⵔ ⵏ ⵜⵏⴰⴼⵓⵜ",
    admin: "ⴰⵎⵙⵙⵓⴳⵓⵔ",
    emailLabel: "ⵉⵎⴰⵢⵍ ⵉⵜⵜⵓⴼⴽⴰⵏ",
    emailPlaceholder: "email@tawsa.ma",
    cniLabel: "ⵓⵟⵟⵓⵏ ⵏ CNI",
    cniPlaceholder: "ⵓⵟⵟⵓⵏ ⵏ CNI",
    btnSending: "ⴰⵣⴰⵏ...",
    btnOtp: "ⴰⵎⵣ ⴰⵙⵉⵜⵉⵎ OTP ⵙ SMS",
    verifyOtp: "ⴰⵙⵙⵉⴷⵢ ⵉⴼⵔⴳⵏ",
    otpSent: "ⵢⴰⵏ ⵓⵙⵉⵜⵉⵎ ⵏ 6 ⵉⵣⵡⵉⵍⵏ ⵉⵜⵜⵓⵣⴰⵏ ⵉ ⵓⵎⵉⴹⴰⵏ",
    otpLabel: "ⴰⵙⵉⵜⵉⵎ ⵉⵜⵜⵓⵎⵣⵏ",
    btnChecking: "ⴰⵙⵙⵉⴷⵢ...",
    btnConfirm: "ⵙⵖⵥⵏ ⴰⴽⵛⵛⵓⵎ",
    back: "ⴰⵖⵓⵍ",
    footer: "ⵉⵣⵔⴼⴰⵏ ⴰⴽⴽⵯ ⵃⵔⵣⵏ",
    secure: "ⴰⵏⵙⴰ ⵉⴼⵔⴳ ⵓⵡⴰⵏⴽ ⴰⵎⵖⵔⵉⴱⵉ"
  }
};

export function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("CITOYEN");

  const initialProfile = ROLE_PROFILES.CITOYEN;
  const [cni, setCni] = useState(initialProfile.cin);
  const [userEmail, setUserEmail] = useState(initialProfile.email);
  const [userPhone, setUserPhone] = useState("0639475920");

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  const { lang } = useUIStore();
  const t = translations[lang] || translations.FR;

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    const profile = ROLE_PROFILES[selectedRole] || ROLE_PROFILES.CITOYEN;
    setCni(profile.cin || profile.matricule || "");
    setUserEmail(profile.email || "");
    setUserPhone(profile.telephone || "0639475920");
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOtpSentMessage(null);

    const generatedRandomCode = String(Math.floor(100000 + Math.random() * 900000));
    setDemoOtp(generatedRandomCode);

    try {
      const response = await fetch("http://localhost:8081/api/features/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          identifier: cni,
          email: userEmail,
          telephone: userPhone.trim() || "0639475920",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur serveur");
      }
      
      const data = await response.json();
      const codeToSend = data.dev_otp || generatedRandomCode;
      setDemoOtp(codeToSend);

      setStep("otp");
      setOtpSentMessage(`[SMS OTP 🔑] Code transmis au N° ${data.telephone || userPhone} : ${codeToSend}`);
      setLoading(false);
    } catch {
      console.warn("Backend hors-ligne ou erreur CORS. Passage à l'étape OTP en mode démo.");
      setStep("otp");
      setOtpSentMessage(`Mode Démo : Votre code OTP transmis est ${generatedRandomCode}`);
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const profile = ROLE_PROFILES[role] || ROLE_PROFILES.CITOYEN;
    const finalCin = cni.trim() || profile.cin;
    const finalEmail = userEmail.trim() || profile.email;

    const userToLogin = {
      cin: finalCin,
      nom: profile.nom,
      prenom: profile.prenom,
      role: role,
      token: 'jwt-demo',
      email: finalEmail,
      matricule: profile.matricule,
      serviceAffectation: profile.service
    };

    try {
      const response = await fetch("http://localhost:8081/api/features/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          identifier: finalCin,
          email: finalEmail,
          code: otpCode,
        }),
      });

      if (response.ok) {
        setTimeout(() => {
          setLoading(false);
          useAuthStore.getState().login(userToLogin);
          navigate("/dashboard");
        }, 400);
      } else {
        if (demoOtp && otpCode.trim() === demoOtp.trim()) {
          setTimeout(() => {
            setLoading(false);
            useAuthStore.getState().login(userToLogin);
            navigate("/dashboard");
          }, 400);
        } else {
          setError(`Code OTP SMS incorrect. Veuillez saisir le code ${demoOtp || "généré"}.`);
          setLoading(false);
        }
      }
    } catch {
      if (demoOtp && otpCode.trim() === demoOtp.trim()) {
        setTimeout(() => {
          setLoading(false);
          useAuthStore.getState().login(userToLogin);
          navigate("/dashboard");
        }, 400);
      } else {
        setError(`Code OTP SMS incorrect. Veuillez saisir le code ${demoOtp || "généré"}.`);
        setLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      dir={lang === "AR" ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-cyan-500 text-white flex items-center justify-center font-black text-4xl mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            T
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t.title}</h2>
          <p className="text-white/70 text-xs mt-1">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {otpSentMessage && step === "otp" && (
          <div className="mb-6 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-100 text-xs font-semibold text-center">
            {otpSentMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCredentialsSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm">
                  {t.roleLabel}
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/30 bg-slate-900 text-white text-xs focus:ring-2 focus:ring-white/50 outline-none transition font-bold"
                >
                  <option value="CITOYEN">{t.citizen}</option>
                  <option value="AGENT_RECLAMATION">{t.agentRec}</option>
                  <option value="AGENT_VALIDATION">{t.agentVal}</option>
                  <option value="AGENT_CERTIFICATION">{t.agentCer}</option>
                  <option value="AGENT_SIGNATURE">{t.agentSig}</option>
                  <option value="MEDIATEUR">{t.mediator}</option>
                  <option value="RESPONSABLE_SERVICE">{t.manager}</option>
                  <option value="ADMINISTRATEUR">{t.admin}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/30 bg-white/15 text-white placeholder:text-white/50 text-xs focus:ring-2 focus:ring-white/50 outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm">
                  {t.cniLabel}
                </label>
                <input
                  type="text"
                  required
                  value={cni}
                  onChange={(e) => setCni(e.target.value)}
                  placeholder={t.cniPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/30 bg-white/15 text-white placeholder:text-white/50 text-xs focus:ring-2 focus:ring-white/50 outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm">
                  N° Téléphone Mobile (Réception SMS Twilio)
                </label>
                <input
                  type="tel"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Ex: 0639475920 ou +212639475920"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/30 bg-white/15 text-white placeholder:text-white/50 text-xs focus:ring-2 focus:ring-white/50 outline-none transition font-mono font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-white hover:bg-slate-50 text-slate-900 font-black py-3 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm tracking-wide cursor-pointer"
              >
                {loading ? <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent" /> : null}
                <span>{loading ? t.btnSending : t.btnOtp}</span>
              </button>
            </motion.form>
          ) : (
            <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center text-2xl mb-4 shadow-inner">💬</div>
                <h3 className="text-white font-bold text-lg">{t.verifyOtp}</h3>
                <p className="text-white/70 text-xs mt-1">
                  {t.otpSent} <br/> <strong className="text-white">{cni} / {userEmail}</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm text-center">
                  {t.otpLabel}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/15 text-white placeholder:text-white/50 text-center text-xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-white/50 outline-none transition"
                />
              </div>
              {error && <div className="p-2.5 rounded-xl bg-red-500/30 text-red-100 text-xs border border-red-400/40 text-center">{error}</div>}
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Vérification OTP..." : "Valider et Accéder à mon Espace Tawsa"}</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
