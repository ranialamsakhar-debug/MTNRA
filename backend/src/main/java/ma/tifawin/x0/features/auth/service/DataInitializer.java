package ma.tifawin.x0.features.auth.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.tifawin.x0.common.enums.AgentStatus;
import ma.tifawin.x0.common.enums.IndicateurAccessibilite;
import ma.tifawin.x0.common.enums.LanguePreferee;
import ma.tifawin.x0.common.enums.NiveauHabilitation;
import ma.tifawin.x0.common.enums.Role;
import ma.tifawin.x0.features.citoyen.entity.DatasetReferenceCitoyen;
import ma.tifawin.x0.features.citoyen.repository.DatasetReferenceCitoyenRepository;
import ma.tifawin.x0.modules.core.entity.*;
import ma.tifawin.x0.modules.core.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DatasetReferenceCitoyenRepository datasetRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initActor("Rania", "LAMSAKHAR", "AI225", "rania.lamsakhar@tawsa.ma", "06 39 47 59 20", "Rania2026@", LocalDate.of(2005, 4, 22), Role.CITOYEN, null);
        initActor("Ahmed", "BENALI", "BK50312", "ahmed.benali@tawsa.ma", "06 61 22 33 44", "Ahmed2026@", LocalDate.of(1985, 3, 15), Role.AGENT_RECLAMATION, "MAT-REC-001");
        initActor("Karim", "EL IDRISSI", "CD78901", "karim.elidrissi@tawsa.ma", "06 62 33 44 55", "Karim2026@", LocalDate.of(1990, 7, 22), Role.AGENT_VALIDATION, "MAT-VAL-001");
        initActor("Fatima", "ZAHRA", "EF12345", "fatima.zahra@tawsa.ma", "06 63 44 55 66", "Fatima2026@", LocalDate.of(1988, 11, 10), Role.AGENT_CERTIFICATION, "MAT-CER-001");
        initActor("Samira", "MANSOURI", "GH67890", "samira.mansouri@tawsa.ma", "06 64 55 66 77", "Samira2026@", LocalDate.of(1992, 1, 28), Role.AGENT_SIGNATURE, "MAT-SIG-001");
        initActor("Youssef", "TAZI", "IJ11223", "youssef.tazi@tawsa.ma", "06 65 66 77 88", "Youssef2026@", LocalDate.of(1975, 6, 5), Role.MEDIATEUR, null);
        initActor("Rachid", "ALAMI", "KL44556", "rachid.alami@tawsa.ma", "06 66 77 88 99", "Rachid2026@", LocalDate.of(1970, 9, 18), Role.RESPONSABLE_SERVICE, "MAT-RES-001");
        initActor("Meryem", "CHRAIBI", "MN77889", "meryem.chraibi@tawsa.ma", "06 67 88 99 00", "Meryem2026@", LocalDate.of(1982, 12, 3), Role.ADMINISTRATEUR, "MAT-ADM-001");
    }

    private void initActor(String prenom, String nom, String cin, String email, String tel, String pwd, LocalDate dob, Role role, String matricule) {
        if (datasetRepository.findByCni(cin).isEmpty()) {
            DatasetReferenceCitoyen record = new DatasetReferenceCitoyen();
            record.setCni(cin);
            record.setNom(nom);
            record.setPrenom(prenom);
            record.setDateNaissance(dob);
            record.setCompteCree(true);
            datasetRepository.save(record);
            log.info("Golden Record créé pour {} {} ({})", prenom, nom, cin);
        }

        if (utilisateurRepository.findByEmail(email).isEmpty()) {
            Utilisateur user = null;

            switch (role) {
                case CITOYEN:
                    Citoyen citoyen = new Citoyen();
                    citoyen.setCin(cin);
                    citoyen.setLanguePreferee(LanguePreferee.FRANCAIS);
                    citoyen.setIndicateurAccessibilite(IndicateurAccessibilite.AUCUN);
                    citoyen.setDateNaissance(dob);
                    citoyen.setTelephoneMobile(tel);
                    citoyen.setAdresse("Rabat, Maroc");
                    user = citoyen;
                    break;
                case AGENT_RECLAMATION:
                    AgentReclamation ar = new AgentReclamation();
                    setAgentProperties(ar, matricule);
                    user = ar;
                    break;
                case AGENT_VALIDATION:
                    AgentValidation av = new AgentValidation();
                    setAgentProperties(av, matricule);
                    user = av;
                    break;
                case AGENT_CERTIFICATION:
                    AgentCertification ac = new AgentCertification();
                    setAgentProperties(ac, matricule);
                    user = ac;
                    break;
                case AGENT_SIGNATURE:
                    AgentSignature as = new AgentSignature();
                    setAgentProperties(as, matricule);
                    user = as;
                    break;
                case MEDIATEUR:
                    Mediateur med = new Mediateur();
                    med.setIdentifiantInstitution("INST-" + cin);
                    med.setInstitutionNom("Institution de Médiation");
                    user = med;
                    break;
                case RESPONSABLE_SERVICE:
                    ResponsableService rs = new ResponsableService();
                    setAgentProperties(rs, matricule);
                    rs.setServiceRepresente("Service Central");
                    user = rs;
                    break;
                case ADMINISTRATEUR:
                    Administrateur admin = new Administrateur();
                    setAgentProperties(admin, matricule);
                    user = admin;
                    break;
                default:
                    return;
            }

            user.setNom(nom);
            user.setPrenom(prenom);
            user.setEmail(email);
            user.setTelephone(tel);
            user.setMotDePasse(pwd);
            user.setRole(role);
            user.setActif(true);
            user.setDateCreation(LocalDateTime.now());
            
            utilisateurRepository.save(user);
            log.info("Compte utilisateur créé pour {} {} (Role: {})", prenom, nom, role);
        }
    }

    private void setAgentProperties(Agent agent, String matricule) {
        agent.setMatricule(matricule);
        agent.setServiceAffectation("Département Central");
        agent.setStatut(AgentStatus.ACTIF);
        agent.setNiveauHabilitation(NiveauHabilitation.NIVEAU_2);
    }
}
