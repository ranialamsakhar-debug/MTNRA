-- V4__seed_all_actors.sql
-- Insert into utilisateurs
INSERT INTO utilisateurs (id, nom, prenom, email, telephone, mot_de_passe, date_creation, role, actif) VALUES
(2001, 'BENALI', 'Ahmed', 'ahmed.benali@tawsa.ma', '06 61 22 33 44', 'Ahmed2026@', CURRENT_TIMESTAMP, 'AGENT_RECLAMATION', true),
(2002, 'EL IDRISSI', 'Karim', 'karim.elidrissi@tawsa.ma', '06 62 33 44 55', 'Karim2026@', CURRENT_TIMESTAMP, 'AGENT_VALIDATION', true),
(2003, 'ZAHRA', 'Fatima', 'fatima.zahra@tawsa.ma', '06 63 44 55 66', 'Fatima2026@', CURRENT_TIMESTAMP, 'AGENT_CERTIFICATION', true),
(2004, 'MANSOURI', 'Samira', 'samira.mansouri@tawsa.ma', '06 64 55 66 77', 'Samira2026@', CURRENT_TIMESTAMP, 'AGENT_SIGNATURE', true),
(2005, 'TAZI', 'Youssef', 'youssef.tazi@tawsa.ma', '06 65 66 77 88', 'Youssef2026@', CURRENT_TIMESTAMP, 'MEDIATEUR', true),
(2006, 'ALAMI', 'Rachid', 'rachid.alami@tawsa.ma', '06 66 77 88 99', 'Rachid2026@', CURRENT_TIMESTAMP, 'RESPONSABLE_SERVICE', true),
(2007, 'CHRAIBI', 'Meryem', 'meryem.chraibi@tawsa.ma', '06 67 88 99 00', 'Meryem2026@', CURRENT_TIMESTAMP, 'ADMINISTRATEUR', true);

-- Insert into agents
INSERT INTO agents (id, matricule, service_affectation, statut, niveau_habilitation) VALUES
(2001, 'MAT-REC-2001', 'Département Réclamations', 'ACTIF', 'NIVEAU_2'),
(2002, 'MAT-VAL-2002', 'Département Validation', 'ACTIF', 'NIVEAU_2'),
(2003, 'MAT-CER-2003', 'Département Certification', 'ACTIF', 'NIVEAU_2'),
(2004, 'MAT-SIG-2004', 'Département Signature', 'ACTIF', 'NIVEAU_2'),
(2006, 'MAT-RES-2006', 'Département Central', 'ACTIF', 'NIVEAU_2'),
(2007, 'MAT-ADM-2007', 'Administration IT', 'ACTIF', 'NIVEAU_2');

-- Subtypes agents
INSERT INTO agent_reclamations (id) VALUES (2001);
INSERT INTO agent_validations (id) VALUES (2002);
INSERT INTO agent_certifications (id) VALUES (2003);
INSERT INTO agent_signatures (id) VALUES (2004);
INSERT INTO responsables_service (id, service_represente) VALUES (2006, 'Service Central');
INSERT INTO administrateurs (id) VALUES (2007);

-- Insert into mediateurs
INSERT INTO mediateurs (id, identifiant_institution, institution_nom) VALUES
(2005, 'INST-IJ11223', 'Médiation Nationale');

-- Insert into dataset_reference_citoyens (assuming ID is BIGSERIAL, let database generate it by not specifying it, or we specify cni etc)
INSERT INTO dataset_reference_citoyens (cni, nom, prenom, date_naissance, compte_cree) VALUES
('BK50312', 'BENALI', 'Ahmed', '1985-03-15', true),
('CD78901', 'EL IDRISSI', 'Karim', '1990-07-22', true),
('EF12345', 'ZAHRA', 'Fatima', '1988-11-10', true),
('GH67890', 'MANSOURI', 'Samira', '1992-01-28', true),
('IJ11223', 'TAZI', 'Youssef', '1975-06-05', true),
('KL44556', 'ALAMI', 'Rachid', '1970-09-18', true),
('MN77889', 'CHRAIBI', 'Meryem', '1982-12-03', true);
