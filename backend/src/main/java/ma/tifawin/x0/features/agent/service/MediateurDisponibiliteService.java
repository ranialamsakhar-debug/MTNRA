package ma.tifawin.x0.features.agent.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.common.enums.LitigeStatut;
import ma.tifawin.x0.features.agent.dto.MediateurPropositionDto;
import ma.tifawin.x0.modules.core.entity.Mediateur;
import ma.tifawin.x0.modules.core.repository.LitigeRepository;
import ma.tifawin.x0.modules.core.repository.MediateurRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MediateurDisponibiliteService {

    private static final List<LitigeStatut> STATUTS_ACTIFS = List.of(
            LitigeStatut.SOUMIS,
            LitigeStatut.EN_INSTRUCTION,
            LitigeStatut.RECOMMANDE);

    private final MediateurRepository mediateurRepository;
    private final LitigeRepository litigeRepository;

    public List<MediateurPropositionDto> proposer(LocalDate date) {
        int jourIso = date.getDayOfWeek().getValue();
        return mediateurRepository.findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getActif()))
                .filter(m -> estDisponible(m, date, jourIso))
                .map(m -> new MediateurPropositionDto(
                        m.getId(),
                        m.getNom(),
                        m.getPrenom(),
                        m.getEmail(),
                        litigeRepository.countByMediateur_IdAndStatutIn(m.getId(), STATUTS_ACTIFS)))
                .sorted(Comparator.comparingLong(MediateurPropositionDto::dossiersEnCours))
                .toList();
    }

    private boolean estDisponible(Mediateur mediateur, LocalDate date, int jourIso) {
        boolean dansLaPeriode = (mediateur.getDateDisponibiliteDebut() == null
                || !date.isBefore(mediateur.getDateDisponibiliteDebut()))
                && (mediateur.getDateDisponibiliteFin() == null
                || !date.isAfter(mediateur.getDateDisponibiliteFin()));
        boolean jourDisponible = mediateur.getJoursDisponibles() == null
                || mediateur.getJoursDisponibles().isBlank()
                || List.of(mediateur.getJoursDisponibles().split(","))
                        .stream()
                        .map(String::trim)
                        .anyMatch(String.valueOf(jourIso)::equals);
        return dansLaPeriode && jourDisponible;
    }
}
