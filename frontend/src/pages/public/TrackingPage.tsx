import { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";

// Fix pour les icônes de marker Leaflet dans React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface TrackingData {
  reference: string;
  statut: string;
  ministere: string;
  adresse: string;
  localisation: {
    lat: number;
    lng: number;
  };
  message: string;
}

export function TrackingPage() {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8081/api/public/tracking/${reference}`);
      if (!res.ok) throw new Error("Référence introuvable");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Impossible de trouver cette référence. Vérifiez votre numéro.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 space-y-8">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">📍 Suivi & Localisation</h1>
        <p className="text-lg text-slate-600">
          Suivez l'état de votre demande ou localisez votre rendez-vous présentiel.
        </p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSearch}
        className="max-w-2xl mx-auto relative flex shadow-lg rounded-2xl overflow-hidden"
      >
        <input
          type="text"
          placeholder="Entrez votre numéro (ex: RDV-12345 ou DOS-7890)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="flex-1 pl-6 pr-4 py-4 border-none outline-none text-slate-800 font-medium"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-primary text-white px-8 font-bold hover:bg-primary/90 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Recherche..." : "Rechercher 🔍"}
        </button>
      </motion.form>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-500 font-medium bg-red-100/50 p-4 rounded-xl max-w-xl mx-auto border border-red-200">
          {error}
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 grid grid-cols-1 md:grid-cols-2 gap-8 mt-10"
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3">Détails de la Référence</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Numéro</p>
                <p className="text-xl font-mono text-primary font-bold">{result.reference}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statut Actuel</p>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-sm">
                  {result.statut.replace("_", " ")}
                </span>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lieu de traitement / RDV</p>
                <p className="font-semibold text-slate-800">{result.ministere}</p>
                <p className="text-slate-600 mt-1 flex items-start gap-2">
                  <span>🏛️</span> {result.adresse}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm mt-4 italic">
                ℹ️ {result.message}
              </div>

              {/* CARD AGENT RÉFÉRENT AFFECTÉ (AHMED BENALI) */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 mt-4">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">👤 Agent Référent Affecté au Dossier :</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">M. Ahmed Benali</p>
                    <p className="text-[10px] text-slate-600 font-semibold">Agent Réclamation & Orientation (AGT-001)</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold">Interlocuteur Officiel</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 z-0">
            <MapContainer 
              center={[result.localisation.lat, result.localisation.lng]} 
              zoom={14} 
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%", minHeight: "300px" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[result.localisation.lat, result.localisation.lng]}>
                <Popup>
                  <strong>{result.ministere}</strong><br/>
                  {result.adresse}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
