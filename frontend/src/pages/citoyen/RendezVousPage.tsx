import { useState } from "react";
import { motion } from "framer-motion";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

export function RendezVousPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
      <UserProfileBanner />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/40"
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-6">📅 Mes Rendez-vous</h1>
        
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-slate-600">Vos prochains rendez-vous administratifs.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition cursor-pointer"
          >
            + Nouveau Rendez-vous
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-start gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary border border-primary/20">
              <span className="text-xs font-bold uppercase">Oct</span>
              <span className="text-xl font-black leading-none">15</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">Dépôt de dossier physique</h3>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">RDV-12345</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Ministère de la Transition Numérique - Annexe Hassan</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">Confirmé</span>
                <span className="text-xs text-slate-400 font-medium">🕒 10:30 AM</span>
              </div>
            </div>
          </div>

          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-start gap-4 opacity-60">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-500 border border-slate-200">
              <span className="text-xs font-bold uppercase">Sep</span>
              <span className="text-xl font-black leading-none">02</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">Consultation Juridique</h3>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">RDV-98765</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Tribunal de Première Instance</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">Passé</span>
                <span className="text-xs text-slate-400 font-medium">🕒 14:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Nouveau Rendez-vous */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 overflow-hidden"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Planifier un nouveau rendez-vous</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); alert("Rendez-vous planifié ! Votre code de suivi est RDV-54321"); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Motif du rendez-vous</label>
                <select required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Sélectionnez un motif</option>
                  <option value="depot">Dépôt de dossier physique</option>
                  <option value="consultation">Consultation juridique ou administrative</option>
                  <option value="suivi">Suivi de dossier complexe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Administration / Annexe</label>
                <select required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Sélectionnez un lieu</option>
                  <option value="mtnra">MTNRA - Rabat Hassan</option>
                  <option value="mtnra_agdal">MTNRA - Rabat Agdal</option>
                  <option value="tribunal">Tribunal de Première Instance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date souhaitée</label>
                  <input type="date" required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Heure</label>
                  <input type="time" required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary/90 transition cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
