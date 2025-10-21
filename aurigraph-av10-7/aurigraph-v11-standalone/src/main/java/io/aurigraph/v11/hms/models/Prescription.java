package io.aurigraph.v11.hms.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Prescription asset for tokenization
 */
public class Prescription extends HealthcareAsset {
    private String patientId;
    private String prescriberId;
    private String pharmacyId;
    private List<Medication> medications;
    private Instant prescriptionDate;
    private Instant expiryDate;
    private String diagnosis;
    private int refillsRemaining;
    private PrescriptionStatus status;

    public Prescription() {
        super(AssetType.PRESCRIPTION);
        this.medications = new ArrayList<>();
        this.prescriptionDate = Instant.now();
        this.status = PrescriptionStatus.ACTIVE;
    }

    public Prescription(String assetId, String patientId, String prescriberId) {
        super(assetId, AssetType.PRESCRIPTION);
        this.patientId = patientId;
        this.prescriberId = prescriberId;
        this.medications = new ArrayList<>();
        this.prescriptionDate = Instant.now();
        this.status = PrescriptionStatus.ACTIVE;
    }

    // Getters and Setters
    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getPrescriberId() {
        return prescriberId;
    }

    public void setPrescriberId(String prescriberId) {
        this.prescriberId = prescriberId;
    }

    public String getPharmacyId() {
        return pharmacyId;
    }

    public void setPharmacyId(String pharmacyId) {
        this.pharmacyId = pharmacyId;
    }

    public List<Medication> getMedications() {
        return medications;
    }

    public void setMedications(List<Medication> medications) {
        this.medications = medications;
    }

    public void addMedication(Medication medication) {
        this.medications.add(medication);
    }

    public Instant getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(Instant prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public int getRefillsRemaining() {
        return refillsRemaining;
    }

    public void setRefillsRemaining(int refillsRemaining) {
        this.refillsRemaining = refillsRemaining;
    }

    public PrescriptionStatus getStatus() {
        return status;
    }

    public void setStatus(PrescriptionStatus status) {
        this.status = status;
    }

    public boolean isExpired() {
        return expiryDate != null && Instant.now().isAfter(expiryDate);
    }

    public boolean hasRefillsAvailable() {
        return refillsRemaining > 0;
    }

    @Override
    public String toString() {
        return "Prescription{" +
                "assetId='" + getAssetId() + '\'' +
                ", patientId='" + patientId + '\'' +
                ", prescriberId='" + prescriberId + '\'' +
                ", medications=" + medications.size() +
                ", prescriptionDate=" + prescriptionDate +
                ", status=" + status +
                '}';
    }

    public enum PrescriptionStatus {
        ACTIVE,
        FILLED,
        EXPIRED,
        CANCELLED,
        REFILLED
    }

    public static class Medication {
        private String name;
        private String dosage;
        private String frequency;
        private int duration;
        private String instructions;

        public Medication() {}

        public Medication(String name, String dosage, String frequency) {
            this.name = name;
            this.dosage = dosage;
            this.frequency = frequency;
        }

        // Getters and Setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDosage() {
            return dosage;
        }

        public void setDosage(String dosage) {
            this.dosage = dosage;
        }

        public String getFrequency() {
            return frequency;
        }

        public void setFrequency(String frequency) {
            this.frequency = frequency;
        }

        public int getDuration() {
            return duration;
        }

        public void setDuration(int duration) {
            this.duration = duration;
        }

        public String getInstructions() {
            return instructions;
        }

        public void setInstructions(String instructions) {
            this.instructions = instructions;
        }
    }
}
