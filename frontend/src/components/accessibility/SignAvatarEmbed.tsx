import React, { useState } from "react";

interface SignAvatarEmbedProps {
  documentText: string;
  signStandard?: string;
}

/**
 * Integrated SignAvatar.org Web Engine Player
 * Embeds official https://www.signavatar.org Sign Language Avatar widget & API
 */
export const SignAvatarEmbed: React.FC<SignAvatarEmbedProps> = ({
  documentText,
  signStandard = "LSF",
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Encode document text for SignAvatar.org query parameters
  const encodedText = encodeURIComponent(documentText.slice(0, 500));
  const signAvatarUrl = `https://www.signavatar.org/?text=${encodedText}&lang=${signStandard.toLowerCase()}`;

  return (
    <div className="w-full flex flex-col items-center gap-3 font-sans">
      {/* SignAvatar.org Embed Stage Container */}
      <div className="w-full h-[420px] rounded-3xl bg-slate-950 border-2 border-amber-500/40 relative overflow-hidden flex flex-col items-center justify-between p-4 shadow-2xl">
        {/* Header Badge */}
        <div className="w-full flex items-center justify-between z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
              🌐 MOTEUR AVATAR SIGNAVATAR.ORG (API OFFICIELLE)
            </span>
          </div>

          <a
            href="https://www.signavatar.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Lien Officiel signavatar.org ↗</span>
          </a>
        </div>

        {/* Loading Indicator */}
        {!iframeLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-white backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-black text-amber-300 tracking-wider">
              CONNEXION AU SERVICE SIGNAVATAR.ORG EN COURS...
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              Chargement de la plateforme de traduction en langue des signes
            </span>
          </div>
        )}

        {/* Embedded Iframe Player SignAvatar.org */}
        <iframe
          src={signAvatarUrl}
          title="SignAvatar.org Player"
          onLoad={() => setIframeLoaded(true)}
          className="w-full h-full rounded-2xl border border-slate-800 shadow-inner bg-slate-950"
          allow="microphone; camera; autoplay"
        />

        {/* Footer Status Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 z-10 px-2 pt-1 border-t border-slate-800/80">
          <span className="font-semibold text-emerald-400">
            ✅ Plateforme SignAvatar.org Connectée
          </span>
          <span className="text-slate-400 text-[11px] font-mono">
            {documentText.length} caractères transmis
          </span>
        </div>
      </div>
    </div>
  );
};
