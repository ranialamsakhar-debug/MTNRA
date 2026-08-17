import { motion } from "framer-motion";

export function HomePage() {
  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-primary">Bienvenue sur Tifawin X.0</h1>
        <p className="mt-3 text-slate-700">
          Deposez vos demandes, suivez vos dossiers, prenez rendez-vous et saisissez le mediateur.
        </p>
      </motion.section>
    </div>
  );
}
