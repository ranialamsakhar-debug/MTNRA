package ma.tifawin.x0.features.public_.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @GetMapping("/actualites")
    public List<Map<String, Object>> getActualites() {
        List<Map<String, Object>> actualites = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        
        actualites.add(Map.of(
            "titre", "Lancement du nouveau portail MTNRA",
            "contenu", "Le ministère a lancé la nouvelle version de son portail. Ce portail unifie l'accès aux services publics en ligne.",
            "source", "MAP",
            "url", "https://map.ma/news1",
            "datePublication", now,
            "categorie", "TRANSITION_NUMERIQUE"
        ));
        
        actualites.add(Map.of(
            "titre", "Simplification des procédures administratives",
            "contenu", "Une nouvelle série de simplifications a été adoptée pour alléger les démarches. Plus de 20 procédures sont concernées.",
            "source", "Le Matin",
            "url", "https://lematin.ma/news2",
            "datePublication", now,
            "categorie", "REFORME_ADMINISTRATIVE"
        ));

        actualites.add(Map.of(
            "titre", "Forum de la Gouvernance Publique 2026",
            "contenu", "Rabat accueille le grand forum de la gouvernance pour discuter des enjeux d'intégrité et de transparence. Plusieurs ministres seront présents.",
            "source", "Hespress",
            "url", "https://hespress.com/news3",
            "datePublication", now,
            "categorie", "GOUVERNANCE"
        ));

        actualites.add(Map.of(
            "titre", "Croissance de l'économie numérique",
            "contenu", "Le secteur du numérique au Maroc connaît une croissance à deux chiffres. Les startups marocaines attirent de plus en plus d'investisseurs.",
            "source", "Medias24",
            "url", "https://medias24.com/news4",
            "datePublication", now,
            "categorie", "ECONOMIE"
        ));

        actualites.add(Map.of(
            "titre", "Programme d'inclusion numérique citoyenne",
            "contenu", "Un nouveau programme vise à former 100 000 citoyens aux outils numériques. L'objectif est de réduire la fracture numérique.",
            "source", "MAP",
            "url", "https://map.ma/news5",
            "datePublication", now,
            "categorie", "SOCIETE"
        ));

        actualites.add(Map.of(
            "titre", "Digitalisation de l'état civil",
            "contenu", "Le registre national de l'état civil est désormais entièrement numérisé. Les citoyens peuvent demander leurs documents en ligne.",
            "source", "Le Matin",
            "url", "https://lematin.ma/news6",
            "datePublication", now,
            "categorie", "TRANSITION_NUMERIQUE"
        ));

        actualites.add(Map.of(
            "titre", "Signature électronique dans l'administration",
            "contenu", "L'usage de la signature électronique qualifiée devient obligatoire pour les marchés publics. Cette mesure accélère le traitement des dossiers.",
            "source", "Medias24",
            "url", "https://medias24.com/news7",
            "datePublication", now,
            "categorie", "REFORME_ADMINISTRATIVE"
        ));

        actualites.add(Map.of(
            "titre", "Open Data : Nouvelles données disponibles",
            "contenu", "Le portail national Open Data s'enrichit de nouveaux jeux de données. Les chercheurs et entreprises peuvent désormais y accéder librement.",
            "source", "Hespress",
            "url", "https://hespress.com/news8",
            "datePublication", now,
            "categorie", "GOUVERNANCE"
        ));

        return actualites;
    }

    @GetMapping("/contacts")
    public List<Map<String, Object>> getContacts() {
        List<Map<String, Object>> contacts = new ArrayList<>();
        
        contacts.add(Map.of(
            "nom", "Ministère de la Transition Numérique et de la Réforme de l'Administration",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 77 77 77",
            "email", "contact@mtnra.gov.ma",
            "siteWeb", "www.mmsp.gov.ma",
            "responsable", "Ghita Mezzour"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Intérieur",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 76 20 00",
            "email", "contact@interieur.gov.ma",
            "siteWeb", "www.interieur.gov.ma",
            "responsable", "Abdelouafi Laftit"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de la Justice",
            "adresse", "Place Mamounia, Rabat, Maroc",
            "telephone", "05 37 73 29 41",
            "email", "contact@justice.gov.ma",
            "siteWeb", "www.justice.gov.ma",
            "responsable", "Abdellatif Ouahbi"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Économie et des Finances",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 67 72 00",
            "email", "contact@finances.gov.ma",
            "siteWeb", "www.finances.gov.ma",
            "responsable", "Nadia Fettah Alaoui"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de la Santé et de la Protection Sociale",
            "adresse", "Avenue Ibn Sina, Agdal, Rabat, Maroc",
            "telephone", "05 37 67 11 11",
            "email", "contact@sante.gov.ma",
            "siteWeb", "www.sante.gov.ma",
            "responsable", "Khalid Ait Taleb"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Éducation Nationale",
            "adresse", "Avenue de la Victoire, Rabat, Maroc",
            "telephone", "05 37 77 18 22",
            "email", "contact@men.gov.ma",
            "siteWeb", "www.men.gov.ma",
            "responsable", "Chakib Benmoussa"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Enseignement Supérieur",
            "adresse", "Rue Driss Al Akbar, Hassan, Rabat, Maroc",
            "telephone", "05 37 76 12 12",
            "email", "contact@enssup.gov.ma",
            "siteWeb", "www.enssup.gov.ma",
            "responsable", "Abdellatif Miraoui"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Agriculture",
            "adresse", "Avenue Hassan II, Rabat, Maroc",
            "telephone", "05 37 76 54 32",
            "email", "contact@agriculture.gov.ma",
            "siteWeb", "www.agriculture.gov.ma",
            "responsable", "Mohamed Sadiki"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Industrie et du Commerce",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 76 89 12",
            "email", "contact@mcinet.gov.ma",
            "siteWeb", "www.mcinet.gov.ma",
            "responsable", "Ryad Mezzour"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de l'Équipement et de l'Eau",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 76 22 22",
            "email", "contact@equipement.gov.ma",
            "siteWeb", "www.equipement.gov.ma",
            "responsable", "Nizar Baraka"
        ));

        contacts.add(Map.of(
            "nom", "Ministère des Habous et des Affaires Islamiques",
            "adresse", "Mechouar, Rabat, Maroc",
            "telephone", "05 37 76 66 66",
            "email", "contact@habous.gov.ma",
            "siteWeb", "www.habous.gov.ma",
            "responsable", "Ahmed Toufiq"
        ));

        contacts.add(Map.of(
            "nom", "Ministère de la Jeunesse, de la Culture et de la Communication",
            "adresse", "Avenue Ibn Sina, Agdal, Rabat, Maroc",
            "telephone", "05 37 67 00 00",
            "email", "contact@mjcc.gov.ma",
            "siteWeb", "www.mjcc.gov.ma",
            "responsable", "Mohamed Mehdi Bensaid"
        ));

        contacts.add(Map.of(
            "nom", "Ministère du Transport et de la Logistique",
            "adresse", "Quartier Administratif, Rabat, Maroc",
            "telephone", "05 37 68 88 88",
            "email", "contact@transport.gov.ma",
            "siteWeb", "www.transport.gov.ma",
            "responsable", "Mohammed Abdeljalil"
        ));

        contacts.add(Map.of(
            "nom", "Ministère des Affaires Étrangères",
            "adresse", "Avenue Franklin Roosevelt, Rabat, Maroc",
            "telephone", "05 37 76 11 23",
            "email", "contact@diplomatie.ma",
            "siteWeb", "www.diplomatie.ma",
            "responsable", "Nasser Bourita"
        ));

        return contacts;
    }

    @GetMapping("/tracking/{reference}")
    public Map<String, Object> getTrackingInfo(@org.springframework.web.bind.annotation.PathVariable String reference) {
        // Simulation d'une API de suivi (dossier ou RDV)
        // Retourne la localisation d'un ministère fictif selon la référence
        
        String statut = "EN_COURS";
        String ministere = "Ministère de la Transition Numérique et de la Réforme de l'Administration";
        String adresse = "Quartier Administratif, Rabat, Maroc";
        double lat = 34.0150; // Coordonnées de Rabat
        double lng = -6.8360;
        
        if (reference.startsWith("RDV")) {
            statut = "RDV_CONFIRME";
        } else if (reference.startsWith("DOS")) {
            statut = "EN_TRAITEMENT";
        }
        
        return Map.of(
            "reference", reference,
            "statut", statut,
            "ministere", ministere,
            "adresse", adresse,
            "localisation", Map.of(
                "lat", lat,
                "lng", lng
            ),
            "message", "Veuillez vous présenter muni de votre CNI à l'accueil du ministère."
        );
    }
}
