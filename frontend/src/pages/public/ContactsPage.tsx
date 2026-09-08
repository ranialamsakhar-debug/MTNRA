import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MinistryContact {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  siteWeb: string;
  responsable: string;
}

const FALLBACK_DATA: MinistryContact[] = [
  { id: 1, nom: "Ministère de la Transition Numérique et de la Réforme de l'Administration", adresse: "Quartier Administratif, Rabat", telephone: "05 37 21 31 41", email: "contact@mtnra.gov.ma", siteWeb: "www.mtnra.gov.ma", responsable: "Ghita Mezzour" },
  { id: 2, nom: "Ministère de l'Intérieur", adresse: "Avenue Mohamed V, Rabat", telephone: "05 37 76 98 61", email: "contact@mi.gov.ma", siteWeb: "www.mi.gov.ma", responsable: "Abdelouafi Laftit" },
  { id: 3, nom: "Ministère de la Justice", adresse: "Place El Mamoun, Rabat", telephone: "05 37 73 06 51", email: "contact@justice.gov.ma", siteWeb: "www.justice.gov.ma", responsable: "Abdellatif Ouahbi" },
  { id: 4, nom: "Ministère de l'Économie et des Finances", adresse: "Boulevard Mohamed V, Rabat", telephone: "05 37 67 74 01", email: "contact@finances.gov.ma", siteWeb: "www.finances.gov.ma", responsable: "Nadia Fettah Alaoui" },
  { id: 5, nom: "Ministère de la Santé et de la Protection Sociale", adresse: "Rue Lamfadel Cherkaoui, Rabat", telephone: "05 37 76 11 21", email: "contact@sante.gov.ma", siteWeb: "www.sante.gov.ma", responsable: "Khalid Ait Taleb" },
  { id: 6, nom: "Ministère de l'Éducation Nationale", adresse: "Bab Rouah, Rabat", telephone: "05 37 77 18 70", email: "contact@men.gov.ma", siteWeb: "www.men.gov.ma", responsable: "Chakib Benmoussa" },
  { id: 7, nom: "Ministère de l'Enseignement Supérieur", adresse: "Rue Idriss Al Akbar, Rabat", telephone: "05 37 21 75 01", email: "contact@enssup.gov.ma", siteWeb: "www.enssup.gov.ma", responsable: "Abdellatif Miraoui" },
  { id: 8, nom: "Ministère de l'Agriculture", adresse: "Quartier Administratif, Rabat", telephone: "05 37 76 36 57", email: "contact@agriculture.gov.ma", siteWeb: "www.agriculture.gov.ma", responsable: "Mohamed Sadiki" },
  { id: 9, nom: "Ministère de l'Industrie et du Commerce", adresse: "Avenue Mohamed V, Rabat", telephone: "05 37 76 18 68", email: "contact@mcinet.gov.ma", siteWeb: "www.mcinet.gov.ma", responsable: "Ryad Mezzour" },
  { id: 10, nom: "Ministère de l'Emploi et de l'Insertion Professionnelle", adresse: "Avenue Mohamed V, Rabat", telephone: "05 37 76 11 91", email: "contact@emploi.gov.ma", siteWeb: "www.emploi.gov.ma", responsable: "Younes Sekkouri" },
  { id: 11, nom: "Ministère de l'Équipement et de l'Eau", adresse: "Rue Haj Ahmed Cherkaoui, Rabat", telephone: "05 37 76 28 11", email: "contact@equipement.gov.ma", siteWeb: "www.equipement.gov.ma", responsable: "Nizar Baraka" },
  { id: 12, nom: "Ministère de la Jeunesse, de la Culture et de la Communication", adresse: "Avenue Gandhi, Rabat", telephone: "05 37 20 94 42", email: "contact@mjcc.gov.ma", siteWeb: "www.mjcc.gov.ma", responsable: "Mohamed Mehdi Bensaid" },
  { id: 13, nom: "Ministère du Transport et de la Logistique", adresse: "Avenue des FAR, Rabat", telephone: "05 37 77 49 02", email: "contact@transport.gov.ma", siteWeb: "www.transport.gov.ma", responsable: "Mohammed Abdeljalil" },
  { id: 14, nom: "Ministère des Affaires Étrangères", adresse: "Avenue Roosevelt, Rabat", telephone: "05 37 76 18 46", email: "contact@maec.gov.ma", siteWeb: "www.maec.gov.ma", responsable: "Nasser Bourita" },
  { id: 15, nom: "Ministère des Habous et des Affaires Islamiques", adresse: "Méchouar Saïd, Rabat", telephone: "05 37 76 68 01", email: "contact@habous.gov.ma", siteWeb: "www.habous.gov.ma", responsable: "Ahmed Toufiq" },
];

export function ContactsPage() {
  const [contacts, setContacts] = useState<MinistryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:8081/api/public/contacts")
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data) => setContacts(data))
      .catch(() => setContacts(FALLBACK_DATA))
      .finally(() => setLoading(false));
  }, []);

  const filteredContacts = contacts.filter((c) =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 space-y-8">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">📞 Annuaire des Ministères du Royaume du Maroc</h1>
        <p className="text-lg text-slate-600">Retrouvez les coordonnées officielles de chaque ministère</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Rechercher un ministère..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredContacts.map((contact) => (
            <motion.div
              key={contact.id}
              variants={itemVariants}
              className="bg-[#800020] rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col space-y-4 hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              <h3 className="font-bold text-lg text-white leading-tight border-b border-white/20 pb-3">
                {contact.nom}
              </h3>
              <div className="space-y-3 text-sm flex-1">
                <p className="flex items-start gap-3 text-white/90">
                  <span className="text-lg">🏛️</span> 
                  <span className="mt-0.5">{contact.adresse}</span>
                </p>
                <p className="flex items-center gap-3 text-white/90">
                  <span className="text-lg">📞</span> 
                  <span className="font-medium text-white">{contact.telephone}</span>
                </p>
                <p className="flex items-center gap-3 text-white/90">
                  <span className="text-lg">📧</span> 
                  <a href={`mailto:${contact.email}`} className="text-rose-200 hover:text-white underline decoration-rose-300/50 hover:decoration-white transition-colors">{contact.email}</a>
                </p>
                <p className="flex items-center gap-3 text-white/90">
                  <span className="text-lg">🌐</span> 
                  <a href={`https://${contact.siteWeb}`} target="_blank" rel="noreferrer" className="text-rose-200 hover:text-white underline decoration-rose-300/50 hover:decoration-white transition-colors">{contact.siteWeb}</a>
                </p>
              </div>
              <div className="pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-white/80 bg-black/20 p-2 rounded-xl">
                <span className="text-base">👤</span>
                <span>Ministre : <span className="font-semibold text-white">{contact.responsable}</span></span>
              </div>
            </motion.div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              Aucun ministère trouvé pour cette recherche.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
