import { useState } from "react";
import ReactDOM from "react-dom";
import { useAuthStore } from "../../store/authStore";
import { compressImageIfNeeded } from "../../utils/imageCompressor";

interface CniPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CniPhotoModal({ isOpen, onClose }: CniPhotoModalProps) {
  const { user, uploadCniPhotoOnce } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isAlreadyUploaded = Boolean(user.cniPhotoUrl);

  const SAMPLE_DEMO_CNI_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setErrorMsg(null);

    try {
      const compressedDataUrl = await compressImageIfNeeded(file, 600, 0.85);
      if (compressedDataUrl && compressedDataUrl.length > 0) {
        setPreviewUrl(compressedDataUrl);
      } else {
        setErrorMsg("Impossible de lire ce fichier photo. Veuillez sélectionner une autre image JPG/PNG.");
      }
    } catch {
      setErrorMsg("Erreur lors de la lecture du fichier photo.");
    }
  };

  const handleSelectDemoAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(SAMPLE_DEMO_CNI_AVATAR);
    setErrorMsg(null);
  };

  const handleConfirmUpload = () => {
    if (!previewUrl) {
      setErrorMsg("Veuillez d'abord sélectionner une photo officielle de votre CNIE.");
      return;
    }

    const success = uploadCniPhotoOnce(previewUrl);

    if (success) {
      setSuccessMsg("✅ Photo officielle de CNIE enregistrée et verrouillée avec succès !");
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMsg("⚠️ Erreur : Impossible d'enregistrer la photo officielle.");
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl border relative max-h-[90vh] overflow-y-auto z-[1000000]">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📸</span>
            <div>
              <h3 className="font-black text-slate-900 text-base">Photo Officielle CNIE</h3>
              <p className="text-[11px] text-slate-500 font-medium">Identité numérique sécurisée MTNRA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 font-bold text-lg cursor-pointer">✕</button>
        </div>

        {/* SI LA PHOTO A DÉJÀ ÉTÉ CHARGÉE (VERROUILLÉE UNE FOIS) */}
        {isAlreadyUploaded ? (
          <div className="space-y-4 text-center">
            <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-amber-500 shadow-xl bg-slate-900 flex items-center justify-center p-1">
              <img
                src={user.cniPhotoUrl}
                alt="Photo Officielle CNIE"
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow border border-white text-xs" title="Vérifié CNIE">
                ✓
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="inline-block px-3 py-1 bg-emerald-700 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                🔒 Photo CNIE Validée & Verrouillée
              </span>
              <p className="text-xs font-bold text-emerald-900 mt-1">
                {user.prenom} {user.nom} ({user.cin})
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                Enregistrée le : {user.cniPhotoUploadedAt || "2026-08-31"}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>🛡️</span> <span>Gouvernance Identité Numérique (MTNRA) :</span>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Conformément aux normes d'authentification biométrique administrative, votre photo officielle de CNIE a été verrouillée et ne peut être modifiée qu'une seule fois pour éviter toute falsification ou usurpation.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* NOUVEAU CHARGEMENT UNIQUE DE LA PHOTO OFFICIELLE */
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-amber-900">
              <span className="font-extrabold flex items-center gap-1">
                <span>⚠️</span> <span>ATTENTION : CHARGEMENT UNIQUE EXCLUSIF</span>
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Vous devez charger votre photo officielle issue de votre **Carte Nationale d'Identité Électronique (CNIE)**. Cette opération ne peut être effectuée **QU'UNE SEULE ET UNIQUE FOIS**.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                {successMsg}
              </div>
            )}

            {/* PREVIEW DE LA PHOTO SELECTIONNEE */}
            {previewUrl ? (
              <div className="space-y-3 text-center">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-lg bg-slate-100">
                  <img src={previewUrl} alt="Aperçu CNIE" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold text-slate-700">{selectedFile ? selectedFile.name : "Photo CNIE d'Identité Validée"}</p>
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Choisir une autre photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition p-4 text-center">
                  <span className="text-3xl mb-1">📷</span>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-primary">Cliquez pour importer</span> votre photo CNIE
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Formats acceptés : JPG, JPEG, PNG, WEBP</p>
                  <input type="file" accept="image/*, .jpg, .jpeg, .png, .webp, .jfif, .pjpeg, .pjp" onChange={handleFileSelect} className="hidden" />
                </label>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">Ou en 1 Clic Démo</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectDemoAvatar}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>👤</span> <span>Utiliser la Photo CNIE Officielle Démo</span>
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={!previewUrl}
                className="flex-1 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary/90 transition shadow disabled:opacity-50 cursor-pointer"
              >
                🔒 Valider & Verrouiller
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
