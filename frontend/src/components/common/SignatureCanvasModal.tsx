import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SignatureCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  dossierId?: string;
  citoyenNom?: string;
}

export function SignatureCanvasModal({
  isOpen,
  onClose,
  onSaveSignature,
  dossierId = "SIG-2026-0044",
  citoyenNom = "Rania LAMSAKHAR"
}: SignatureCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#0f172a");

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = strokeColor;
      }
      setHasDrawn(false);
    }
  }, [isOpen, strokeColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>✍️</span> Signature Manuscrite à la Souris
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dossier N° <span className="font-bold text-slate-800">{dossierId}</span> • Citoyen: <span className="font-bold text-slate-800">{citoyenNom}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Zone Canvas pour dessiner avec la souris */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Dessinez votre signature dans le cadre ci-dessous à l'aide de votre souris ou pavé tactile :
          </label>
          <div className="border border-slate-300 rounded-2xl bg-slate-50 p-2 relative">
            <canvas
              ref={canvasRef}
              width={440}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 bg-white rounded-xl cursor-crosshair shadow-inner touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium italic">
                ✏️ Maintenez le clic gauche et bougez la souris pour signer ici...
              </div>
            )}
          </div>
        </div>

        {/* Sélection de la couleur du trait */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Couleur d'encre :</span>
            <button
              onClick={() => setStrokeColor("#0f172a")}
              className={`w-6 h-6 rounded-full border-2 ${strokeColor === "#0f172a" ? "border-slate-900 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: "#0f172a" }}
              title="Noir Officiel"
            />
            <button
              onClick={() => setStrokeColor("#1e40af")}
              className={`w-6 h-6 rounded-full border-2 ${strokeColor === "#1e40af" ? "border-slate-900 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: "#1e40af" }}
              title="Bleu Institutionnel"
            />
            <button
              onClick={() => setStrokeColor("#047857")}
              className={`w-6 h-6 rounded-full border-2 ${strokeColor === "#047857" ? "border-slate-900 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: "#047857" }}
              title="Vert Sceau"
            />
          </div>

          <button
            onClick={handleClear}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold hover:underline flex items-center gap-1"
          >
            🗑️ Effacer
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 ${
              hasDrawn
                ? "bg-slate-900 hover:bg-slate-800 shadow-sm"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <span>📜</span> Apposer la Signature & Générer l'Autorisation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
