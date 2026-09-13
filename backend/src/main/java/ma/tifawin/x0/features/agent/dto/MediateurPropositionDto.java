package ma.tifawin.x0.features.agent.dto;

public record MediateurPropositionDto(
        Long id,
        String nom,
        String prenom,
        String email,
        long dossiersEnCours) {
}
