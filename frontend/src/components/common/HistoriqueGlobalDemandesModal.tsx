import { useState } from "react";
import { motion } from "framer-motion";
import { OfficialPermissionSheet } from "./OfficialPermissionSheet";

interface HistoriqueDemandeItem {
  id: string;
  citoyenNom: string;
  cni: string;
  titre: string;
  agentRef: string;
  dateTraitement: string;
  statut: "ACCEPTÉ" | "VALIDÉ" | "CERTIFIÉ" | "SIGNÉ";
}

interface HistoriqueGlobalDemandesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoriqueGlobalDemandesModal({
  isOpen,
  onClose
}: HistoriqueGlobalDemandesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSheetDossier, setSelectedSheetDossier] = useState<HistoriqueDemandeItem | null>(null);

  const [historyData] = useState<HistoriqueDemandeItem[]>([
    {
      id: "DOS-2026-0044",
      citoyenNom: "Rania LAMSAKHAR",
      cni: "AI225",
      titre: "Permis d'Exploitation Commerciale Régionale",
      agentRef: "Samira MANSOURI (Signature)",
      dateTraitement: "03/09/2026",
      statut: "SIGNÉ"
    },
    {
      id: "DOS-2026-0039",
      citoyenNom: "Fatima EZZAHRA",
      cni: "EF12345",
      titre: "Certificat de Propriété et Régularisation Foncière",
      agentRef: "Fatima ZAHRA (Certification)",
      dateTraitement: "02/09/2026",
      statut: "CERTIFIÉ"
    },
    {
      id: "DOS-2026-0021",
      citoyenNom: "Karim EL IDRISSI",
      cni: "CD78901",
      titre: "Agrément d'Investissement & Extension d'Usine",
      agentRef: "Karim EL IDRISSI (Validation)",
      dateTraitement: "01/09/2026",
      statut: "VALIDÉ"
    },
    {
      id: "DOS-2026-0012",
      citoyenNom: "Ahmed BENALI",
      cni: "BK50312",
      titre: "Réclamation sur Taxe Foncière Régionale",
      agentRef: "Ahmed BENALI (Réclamation)",
      dateTraitement: "30/08/2026",
      statut: "ACCEPTÉ"
    },
    {
      id: "DOS-2026-0008",
      citoyenNom: "Youssef TAZI",
      cni: "IJ11223",
      titre: "Médiation Administrative et Accord Amiable",
      agentRef: "Youssef TAZI (Médiateur)",
      dateTraitement: "28/08/2026",
      statut: "ACCEPTÉ"
    }
  ]);

  if (!isOpen) return null;

  const filteredHistory = historyData.filter((item) =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.citoyenNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.agentRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 space-y-6"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-2xl font-black">
              🏛️
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Historique Général des Demandes</h2>
              <p className="text-xs text-slate-500 font-medium">
                Registre partagé des dossiers traités et des actes signés par tous les agents habilités.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Barre de Recherche */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par N° Dossier, Nom du Citoyen, Titre ou Agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tableau de l'Historique */}
        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="p-3.5">N° Dossier</th>
                <th className="p-3.5">Citoyen</th>
                <th className="p-3.5">Titre de la Demande</th>
                <th className="p-3.5">Agent Référent</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-3.5 font-bold text-slate-900 font-mono">{row.id}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{row.citoyenNom}</p>
                    <p className="text-[10px] text-slate-400">CNI: {row.cni}</p>
                  </td>
                  <td className="p-3.5 max-w-xs truncate">{row.titre}</td>
                  <td className="p-3.5 font-semibold text-slate-800">{row.agentRef}</td>
                  <td className="p-3.5">
                    <span className="bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4] font-extrabold px-2.5 py-0.5 rounded-md text-[10px] shadow-sm">
                      ✓ {row.statut}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedSheetDossier(row)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ml-auto shadow-sm"
                    >
                      <span>📜</span> Voir l'Acte Signé
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal d'affichage de la feuille de permission signée */}
        {selectedSheetDossier && (
          <OfficialPermissionSheet
            dossierId={selectedSheetDossier.id}
            citoyenNom={selectedSheetDossier.citoyenNom}
            cni={selectedSheetDossier.cni}
            titre={selectedSheetDossier.titre}
            dateSignature={selectedSheetDossier.dateTraitement}
            agentNom={selectedSheetDossier.agentRef}
            onClose={() => setSelectedSheetDossier(null)}
          />
        )}
      </motion.div>
    </div>
  );
}
