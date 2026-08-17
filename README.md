# Tifawin X.0 - Cahier d'Architecture Complet (Sans Code)

Ce document formalise l'architecture complete de la plateforme Tifawin X.0 (frontend + backend + IA), en couvrant les domaines fonctionnels, les contrats d'interface, le modele de donnees, les workflows metier, les routes et les exigences non fonctionnelles.

Objectif: fournir une specification executable par une equipe de developpement ou une IA sans ambiguite, sans inclure de code source.

---

## 1) Contexte Metier

Tifawin X.0 est une plateforme numerique d'administration ministerielle marocaine qui permet:

1. Depot de demandes/reclamations citoyennes.
2. Traitement multi-acteurs via circuit administratif (reclamation, validation, certification, signature).
3. Prise de rendez-vous avec les services.
4. Saisine du Mediateur en cas de litige.
5. Accessibilite avancee (STT, TTS, langue des signes marocaine).
6. Signature electronique simple et qualifiee.
7. Reporting operationnel et analytique.

---

## 2) Stack Technique Imposee

## 2.1 Backend

1. Spring Boot (derniere version stable).
2. Spring Security avec JWT + RBAC.
3. Spring Data JPA.
4. PostgreSQL.
5. Architecture en couches: Controller / Service / Repository / DTO / Entity.
6. Microservices IA Python FastAPI isoles.
7. Cache Redis (performance, sessions techniques, donnees de reference).

## 2.2 Frontend

1. React (hooks + context).
2. Tailwind CSS (design system personnalise).
3. Framer Motion (animations et transitions).
4. Recharts ou Chart.js (dashboards).
5. Power BI Embed (reporting avance).
6. React Router (navigation).
7. Axios (consommation API).
8. React Hook Form (formulaires).
9. Zustand ou Redux Toolkit (etat global).
10. TanStack Query (cache serveur).
11. WebSocket ou SSE (temps reel).
12. React Leaflet (cartes interactives).

---

## 3) Hierarchie des Acteurs

```text
Utilisateur (abstraite)
|-- Citoyen
|-- Mediateur
`-- Agent (abstraite)
	 |-- AgentReclamation
	 |-- AgentValidation
	 |-- AgentCertification
	 |-- AgentSignature
	 |-- Administrateur
	 `-- ResponsableService
```

## 3.1 Attributs Communs Utilisateur

1. id (Long)
2. nom (String)
3. prenom (String)
4. email (String, unique)
5. telephone (String)
6. motDePasse (String, hache)
7. dateCreation (LocalDateTime)
8. role (Enum)
9. actif (Boolean)
10. derniereConnexion (LocalDateTime)

## 3.2 Attributs Specifiques Agent

1. matricule (String, unique)
2. serviceAffectation (String)
3. statut (ACTIF, EN_CONGE, SUSPENDU)
4. niveauHabilitation (NIVEAU_1, NIVEAU_2, NIVEAU_3)

## 3.3 Attributs Specifiques Citoyen

1. cin (String, unique, golden record)
2. languePreferee (FRANCAIS, ARABE, DARIJA)
3. indicateurAccessibilite (AUCUN, MALENTENDANT, NON_LECTEUR, MALVOYANT)
4. dateNaissance (LocalDate)
5. adresse (String)
6. telephoneMobile (String)

## 3.4 Attributs Specifiques Mediateur

1. identifiantInstitution (String)
2. institutionNom (String)

## 3.5 Attributs Specifiques ResponsableService

1. serviceRepresente (String)
2. agentsSupervises (List<Agent>)

---

## 4) Entites Metier Principales

## 4.1 Dossier

1. idDossier, numeroDossier (unique)
2. dateCreation, dateCloture
3. typeDemande
4. statut: BROUILLON, SOUMIS, EN_TRAITEMENT, EN_VALIDATION, EN_CERTIFICATION, EN_SIGNATURE, CLOTURE, REJETE, ANNULE
5. citoyen
6. agents assignes par etape
7. description
8. priorite: BASSE, NORMALE, HAUTE, URGENTE

## 4.2 TypeDemande

1. id, code (unique), libelle, description
2. workflow (JSON)
3. dureeTraitementJours
4. actif

## 4.3 Document

1. idDocument
2. type: CNI, PASSEPORT, ACTE_NAISSANCE, PERMIS, ATTESTATION, AUTRE
3. nomFichier, cheminFichier, taille
4. hash (SHA-256)
5. dateAjout
6. dossier, citoyen
7. verifie
8. scoreFiabilite

## 4.4 Signature (abstraite)

1. idSignature, dateSignature
2. dossier, citoyen

### SignatureSimple

1. imageSignature
2. ipAdresse
3. userAgent
4. reAuthentifie

### SignatureQualifiee

1. idCertificat
2. autoriteCertification
3. horodatageCertifie
4. certificatValide

## 4.5 Litige

1. idLitige, numeroLitige (unique)
2. dossier, citoyen
3. motif, description
4. dateSaisine
5. statut: SOUMIS, EN_INSTRUCTION, RECOMMANDE, MIS_EN_OEUVRE, CLOS
6. mediateur
7. serviceConcerne
8. recommandation
9. dateRecommandation, dateMiseEnOeuvre

## 4.6 Service

1. idService, codeService (unique)
2. nomService, description
3. responsable
4. contactPoint, telephone, adresse
5. actif

## 4.7 RendezVous

1. idRdv
2. dateRdv, heureRdv, duree
3. motif
4. statut: DEMANDE, CONFIRME, HONORE, ANNULE, REPORTE
5. citoyen, service, agent
6. dateCreation, dateModification

## 4.8 HistoriqueAction

1. idAction
2. typeAction: CREATION, MODIFICATION, VALIDATION, REJET, CERTIFICATION, SIGNATURE, TRANSMISSION, CLOTURE, SAISINE_MEDIATEUR, RECOMMANDATION
3. dateHeure
4. details
5. utilisateur
6. dossier
7. ipAdresse, userAgent

## 4.9 Notification

1. idNotification
2. contenu
3. dateEnvoi
4. canal: EMAIL, SMS, PUSH
5. statutLecture: NON_LU, LU
6. dateLecture
7. destinataire
8. dossier
9. lien

## 4.10 Message (messagerie interne)

1. idMessage
2. contenu, dateEnvoi
3. expediteur (Agent)
4. destinataire (Agent)
5. lu, dateLecture
6. pieceJointe
7. messageParent

## 4.11 Actualite

1. idActualite
2. titre, contenu
3. datePublication, dateScraping
4. source, url, imageUrl, categorie

## 4.12 CoordonneeBureau

1. id
2. nomBureau, adresse, ville, codePostal
3. telephone, email
4. latitude, longitude
5. horaires
6. service

## 4.13 ConversationChatbot

1. idConversation
2. utilisateur
3. dateCreation
4. messages

## 4.14 MessageChatbot

1. idMessage
2. conversation
3. auteur: UTILISATEUR, CHATBOT
4. contenu
5. dateEnvoi
6. sources (JSON)

---

## 5) Schema Relationnel et Cardinalites

1. Utilisateur 1..0..1 Citoyen.
2. Utilisateur 1..0..1 Mediateur.
3. Utilisateur 1..0..1 Agent.
4. Citoyen 1..N Dossier.
5. Dossier N..1 TypeDemande.
6. Dossier 1..N Document.
7. Dossier 1..N HistoriqueAction.
8. Dossier 1..N Notification.
9. Dossier 0..N Litige.
10. Dossier 0..1 SignatureSimple.
11. Dossier 0..N SignatureQualifiee.
12. Service 1..N RendezVous.
13. Citoyen 1..N RendezVous.
14. Agent 0..N RendezVous.
15. Service 1..N CoordonneeBureau.
16. Mediateur 1..N Litige.
17. ResponsableService 1..N Agent (supervision).
18. Utilisateur 1..N Notification.
19. Agent 1..N Message (expediteur).
20. Agent 1..N Message (destinataire).
21. ConversationChatbot 1..N MessageChatbot.
22. Utilisateur 1..N ConversationChatbot.

Contraintes critiques:

1. Uniques: email, cin, matricule, numeroDossier, numeroLitige, codeTypeDemande, codeService.
2. Deduplication citoyen par CIN avant creation compte.
3. Machine d'etat obligatoire pour transition de statut dossier.
4. Historisation obligatoire des actions critiques.

---

## 6) Workflows Metier

## 6.1 Circuit Reclamation / Demande (Niveau 1)

### Reclamation simple

1. Citoyen depose.
2. AgentReclamation traite.
3. AgentReclamation cloture.

### Demande de document officiel

1. Citoyen depose.
2. AgentReclamation receptionne et qualifie.
3. AgentReclamation transmet a AgentValidation.
4. AgentValidation examine et valide/rejette.
5. AgentCertification verifie l'integrite et certifie.
6. AgentSignature signe, horodate, envoie au citoyen.

## 6.2 Circuit Litige (Niveau 2)

1. Citoyen saisit le Mediateur.
2. Mediateur demande explication au service.
3. ResponsableService repond.
4. Mediateur formule recommandation.
5. ResponsableService met en oeuvre et rend compte.

## 6.3 Prise de Rendez-vous

1. Consultation des creneaux.
2. Reservation.
3. Confirmation.
4. Annulation/report possibles.
5. Gestion des creneaux par service.

## 6.4 Verification Identite / Deduplication

1. Recherche CIN avant inscription citoyen.
2. Rejet creation compte si CIN existant.

---

## 7) Architecture Backend Spring Boot

## 7.1 Structure de Packages (reference)

1. auth
2. security
3. user
4. citoyen
5. agent
6. dossier
7. type-demande
8. document
9. signature
10. litige
11. service-public
12. rendez-vous
13. historique
14. notification
15. messaging
16. actualite
17. bureau
18. chatbot
19. dashboard
20. reporting
21. common (exceptions, enums, mapping, pagination)
22. integration (clients IA, email, sms, websocket)

Chaque module contient:

1. controller
2. service
3. repository
4. dto (request/response)
5. entity
6. mapper
7. specification (filtres dynamiques)

## 7.2 Services Transverses Backend

1. AuditService (HistoriqueAction auto).
2. NotificationOrchestrator (email/sms/push).
3. WorkflowEngine (transitions dossier).
4. DocumentIntegrityService (hash + verification IA).
5. SignatureService (simple + qualifiee + groupee).
6. AccessControlPolicyService (RBAC + ownership).
7. SchedulerService (scraping actualites + rappels rdv).
8. ChatbotGatewayService (RAG API).
9. ReportingService (kpis + export + Power BI metadata).

## 7.3 Strategie de Securite

1. JWT access token court + refresh token.
2. RBAC au niveau endpoint et service.
3. Verification ownership sur ressources citoyen.
4. Rate limiting sur endpoints publics sensibles.
5. Journalisation securite (login, reset, echec auth).

---

## 8) Structure Frontend React

## 8.1 Arborescence Fonctionnelle

1. app shell
2. layouts
3. pages publiques
4. pages authentifiees par role
5. components communs
6. modules metier (dossiers, litiges, rdv, messagerie, notifications)
7. state global (auth, role, ui, preferences)
8. api clients (axios)
9. query hooks (TanStack Query)
10. forms (React Hook Form)
11. i18n + accessibilite
12. realtime (WebSocket/SSE)
13. charts + analytics
14. map + geospatial

## 8.2 Layouts

1. PublicLayout.
2. AuthenticatedLayout.
3. DashboardLayout.

## 8.3 Composants Communs

1. Navbar.
2. Sidebar dynamique par role.
3. Footer.
4. Breadcrumb.
5. ChatbotFloating.
6. NotificationBell.
7. UserProfileMenu.
8. AccessibilityControls.
9. Table, Card, Modal, Timeline.
10. LoadingSpinner anime (Framer Motion).
11. ToastNotifications.
12. PowerBiEmbedContainer.
13. LeafletOfficeMap.

## 8.4 Pages Publiques

1. Accueil:
	- Hero anime.
	- Services.
	- Actualites.
	- Conseils.
	- Contact et carte.
2. Connexion.
3. Chatbot (overlay depuis floating button).
4. Actualites.
5. Conseils.
6. Contact.

## 8.5 Pages Authentifiees

1. Dashboard par role.
2. Dossiers (liste, creation multi-etapes, detail, timeline).
3. Rendez-vous.
4. Litiges.
5. Messagerie.
6. Notifications.
7. Administration.
8. Rapports analytiques.

---

## 9) Contrats d'Interface IA (FastAPI)

Les contrats ci-dessous doivent etre exposes par les microservices IA.

## 9.1 STT

1. POST /api/voice/transcribe
2. Input: multipart (file, language: ary/ar/fr)
3. Output: transcription, confidence, languageDetected, duration

## 9.2 TTS

1. POST /api/voice/synthesize
2. Input: text, language, voice
3. Output: flux audio/mpeg

## 9.3 LSM

1. POST /api/sign-language/recognize
2. Input: video (+ optional frames)
3. Output: transcription, confidence, gestureSequence, processingTime

## 9.4 Verification documentaire

1. POST /api/document/verify
2. Input: file, documentType
3. Output: scoreFiabilite, anomalies, hash, documentTypeDetected, extractedData, isAuthentic

## 9.5 Chatbot RAG

1. POST /api/chatbot/query
2. Input: question, dossierId, utilisateurId, langue
3. Output: reponse, sources, confiance, conversationId

---

## 10) Endpoints Backend a Implementer

Tous les endpoints listes ici sont obligatoires.

## 10.1 Authentification

1. POST /api/auth/login
2. POST /api/auth/logout
3. POST /api/auth/register
4. POST /api/auth/refresh-token
5. POST /api/auth/forgot-password
6. POST /api/auth/reset-password
7. GET /api/auth/me

## 10.2 Citoyen

1. GET /api/citoyen/dossiers
2. POST /api/citoyen/dossiers
3. GET /api/citoyen/dossiers/{id}
4. GET /api/citoyen/dossiers/{id}/statut
5. POST /api/citoyen/dossiers/{id}/documents
6. GET /api/citoyen/dossiers/{id}/documents
7. POST /api/citoyen/dossiers/{id}/signature
8. POST /api/citoyen/dossiers/{id}/litige
9. GET /api/citoyen/rdv
10. POST /api/citoyen/rdv
11. PUT /api/citoyen/rdv/{id}
12. GET /api/citoyen/historique
13. POST /api/citoyen/avis
14. PUT /api/citoyen/profil

## 10.3 AgentReclamation

1. GET /api/agent-reclamation/dossiers
2. GET /api/agent-reclamation/dossiers/{id}
3. PUT /api/agent-reclamation/dossiers/{id}/qualifier
4. POST /api/agent-reclamation/dossiers/{id}/reponse
5. PUT /api/agent-reclamation/dossiers/{id}/transmettre
6. PUT /api/agent-reclamation/dossiers/{id}/cloturer
7. GET /api/agent-reclamation/charge
8. GET /api/agent-reclamation/messages
9. POST /api/agent-reclamation/messages

## 10.4 AgentValidation

1. GET /api/agent-validation/dossiers
2. GET /api/agent-validation/dossiers/{id}
3. PUT /api/agent-validation/dossiers/{id}/valider
4. PUT /api/agent-validation/dossiers/{id}/rejeter
5. POST /api/agent-validation/dossiers/{id}/anomalie
6. GET /api/agent-validation/historique
7. PUT /api/agent-validation/dossiers/{id}/transmettre

## 10.5 AgentCertification

1. GET /api/agent-certification/dossiers
2. GET /api/agent-certification/dossiers/{id}
3. POST /api/agent-certification/dossiers/{id}/verifier
4. POST /api/agent-certification/dossiers/{id}/certifier
5. POST /api/agent-certification/dossiers/{id}/falsification

## 10.6 AgentSignature

1. GET /api/agent-signature/dossiers
2. GET /api/agent-signature/dossiers/{id}
3. POST /api/agent-signature/dossiers/{id}/signer
4. POST /api/agent-signature/dossiers/{id}/envoyer
5. POST /api/agent-signature/dossiers/{id}/confirmer-reception
6. POST /api/agent-signature/signature-groupee
7. POST /api/agent-signature/dossiers/{id}/archiver

## 10.7 Administrateur

1. GET /api/admin/utilisateurs
2. POST /api/admin/utilisateurs
3. PUT /api/admin/utilisateurs/{id}
4. DELETE /api/admin/utilisateurs/{id}
5. PUT /api/admin/utilisateurs/{id}/roles
6. GET /api/admin/type-demandes
7. POST /api/admin/type-demandes
8. PUT /api/admin/type-demandes/{id}
9. DELETE /api/admin/type-demandes/{id}
10. GET /api/admin/workflows
11. POST /api/admin/workflows
12. PUT /api/admin/workflows/{id}
13. GET /api/admin/audit
14. GET /api/admin/dashboard
15. GET /api/admin/actualites
16. POST /api/admin/actualites
17. PUT /api/admin/actualites/{id}
18. DELETE /api/admin/actualites/{id}
19. GET /api/admin/bureaux
20. POST /api/admin/bureaux
21. PUT /api/admin/bureaux/{id}
22. DELETE /api/admin/bureaux/{id}
23. GET /api/admin/rapports

## 10.8 ResponsableService

1. GET /api/responsable-service/litiges
2. GET /api/responsable-service/litiges/{id}
3. POST /api/responsable-service/litiges/{id}/reponse
4. PUT /api/responsable-service/litiges/{id}/mettre-en-oeuvre
5. GET /api/responsable-service/agents
6. GET /api/responsable-service/statistiques
7. GET /api/responsable-service/creneaux
8. POST /api/responsable-service/creneaux
9. PUT /api/responsable-service/creneaux/{id}

## 10.9 Mediateur

1. GET /api/mediateur/saisines
2. GET /api/mediateur/saisines/{id}
3. POST /api/mediateur/saisines/{id}/recommandation
4. PUT /api/mediateur/saisines/{id}/suivre
5. POST /api/mediateur/saisines/{id}/relancer
6. GET /api/mediateur/statistiques
7. GET /api/mediateur/rapports

---

## 11) Plan de Navigation Frontend (Routes)

## 11.1 Publiques

1. /
2. /login
3. /actualites
4. /actualites/:id
5. /conseils
6. /contact

## 11.2 Authentifiees Communes

1. /dashboard
2. /notifications
3. /messages
4. /profil

## 11.3 Par Role

### Citoyen

1. /citoyen/dossiers
2. /citoyen/dossiers/nouveau
3. /citoyen/dossiers/:id
4. /citoyen/rendez-vous
5. /citoyen/litiges
6. /citoyen/historique

### AgentReclamation

1. /agent-reclamation/dossiers
2. /agent-reclamation/dossiers/:id
3. /agent-reclamation/charge

### AgentValidation

1. /agent-validation/dossiers
2. /agent-validation/dossiers/:id
3. /agent-validation/historique

### AgentCertification

1. /agent-certification/dossiers
2. /agent-certification/dossiers/:id

### AgentSignature

1. /agent-signature/dossiers
2. /agent-signature/dossiers/:id
3. /agent-signature/signature-groupee

### ResponsableService

1. /responsable-service/litiges
2. /responsable-service/litiges/:id
3. /responsable-service/agents
4. /responsable-service/creneaux
5. /responsable-service/statistiques

### Mediateur

1. /mediateur/saisines
2. /mediateur/saisines/:id
3. /mediateur/rapports
4. /mediateur/statistiques

### Administrateur

1. /admin/utilisateurs
2. /admin/type-demandes
3. /admin/workflows
4. /admin/audit
5. /admin/dashboard
6. /admin/actualites
7. /admin/bureaux
8. /admin/rapports

---

## 12) Maquettes Fonctionnelles (Specification UX)

## 12.1 Dashboard

1. Bandeau KPI (dossiers en attente, delais moyens, taux de cloture).
2. Graphiques de tendance (volume, statuts, performances par service).
3. Liste des actions prioritaires.
4. Bloc notifications recentes.

## 12.2 Gestion Dossier

1. Vue liste avec filtres, tri, recherche, pagination.
2. Formulaire multi-etapes avec sauvegarde brouillon.
3. Detail dossier en onglets:
	- Resume.
	- Documents.
	- Historique.
	- Messagerie.
	- Signature.
4. Timeline workflow visuelle.

## 12.3 Rendez-vous

1. Calendrier interactif par service.
2. Selection de creneau.
3. Confirmation visuelle + notifications.
4. Report/annulation avec controle de delai.

## 12.4 Litige et Mediation

1. Depot saisine citoyen.
2. Console mediateur pour instruction.
3. Interface reponse service.
4. Suivi de mise en oeuvre des recommandations.

## 12.5 Accessibilite

1. Boutons "Dicter" (STT).
2. Boutons "Ecouter" (TTS).
3. Mode langue des signes (capture webcam + transcription).
4. Contraste eleve.
5. Changement de langue instantane.

---

## 13) Contrats OpenAPI a Produire

Le contrat API doit inclure:

1. Tags par domaine.
2. Schemas request/response (DTOs).
3. Security schemes JWT.
4. Erreurs normalisees (400, 401, 403, 404, 409, 422, 500).
5. Exemples de payloads.
6. Pagination et filtres standards.
7. Webhooks ou canaux real-time documentes (notifications).

---

## 14) DTOs a Definir (Inventaire)

Le projet doit definir des DTOs request/response pour:

1. Authentification (login/register/refresh/password).
2. Utilisateur/Citoyen/Agent/Mediateur/Responsable.
3. Dossier (create/update/detail/list/status/timeline).
4. TypeDemande (CRUD + workflow).
5. Document (upload/list/detail/verification).
6. Signature simple/qualifiee/groupee.
7. Litige (create/detail/recommandation/mise-en-oeuvre).
8. Service et Bureaux (CRUD + map markers).
9. RendezVous et creneaux.
10. HistoriqueAction et audit.
11. Notification center.
12. Messagerie interne.
13. Actualites.
14. Chatbot conversation/messages/query.
15. Dashboard KPI et reporting.

---

## 15) Exigences Non Fonctionnelles

1. RESTful documente (OpenAPI).
2. Separation stricte des couches.
3. RBAC strict sur tous les endpoints.
4. Audit complet et tracabilite.
5. Notifications asynchrones email/SMS/push.
6. Tests unitaires et integration sur endpoints critiques.
7. Scalabilite via microservices IA isoles.
8. Securite des donnees sensibles (chiffrement/hachage).
9. Performance (cache Redis, pagination, index SQL).
10. Disponibilite cible 99.9%.
11. Responsive desktop/tablette/mobile.
12. Conformite accessibilite WCAG 2.1 AA.

---

## 16) Plan d'Implementation Recommande

## Phase 1 (Fondation)

1. Auth + RBAC + gestion utilisateurs.
2. Entites coeur + schema base de donnees.
3. Dossiers + workflows de base + audit.

## Phase 2 (Processus Metier)

1. Circuit agents complet.
2. Documents + verification + signatures.
3. Litiges et mediation.
4. Rendez-vous.

## Phase 3 (Experience Etendue)

1. Accessibilite STT/TTS/LSM.
2. Chatbot RAG.
3. Actualites (scraping) + carte bureaux.

## Phase 4 (Pilotage et Industrialisation)

1. Reporting Power BI + dashboards.
2. Optimisations perf/securite.
3. Durcissement qualite et observabilite.

---

## 17) Definition of Done (Globale)

1. Tous les endpoints section 10 exposes et testes.
2. Tous les workflows metier executables sans rupture.
3. Aucune creation citoyen en doublon CIN.
4. Audit complet des actions critiques.
5. Notifications temps reel operationnelles.
6. Accessibilite active et testee sur parcours critiques.
7. Conformite role-based UI + API.
8. Documentation API et architecture a jour.

---

Ce README constitue la specification de reference de Tifawin X.0 pour implementation frontend et backend complete, sans code.
