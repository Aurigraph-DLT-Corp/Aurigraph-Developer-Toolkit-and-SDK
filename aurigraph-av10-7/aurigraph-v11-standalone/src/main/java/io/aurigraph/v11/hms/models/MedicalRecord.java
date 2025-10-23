package io.aurigraph.v11.hms.models;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Medical Record asset for tokenization
 */
public class MedicalRecord extends HealthcareAsset {
    private String patientId;
    private String providerId;
    private String diagnosis;
    private String treatmentNotes;
    private Map<String, String> vitalSigns;
    private String medicalHistory;
    private Instant recordDate;

    public MedicalRecord() {
        super(AssetType.MEDICAL_RECORD);
        this.vitalSigns = new HashMap<>();
    }

    public MedicalRecord(String assetId, String patientId, String providerId) {
        super(assetId, AssetType.MEDICAL_RECORD);
        this.patientId = patientId;
        this.providerId = providerId;
        this.vitalSigns = new HashMap<>();
        this.recordDate = Instant.now();
    }

    // Getters and Setters
    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatmentNotes() {
        return treatmentNotes;
    }

    public void setTreatmentNotes(String treatmentNotes) {
        this.treatmentNotes = treatmentNotes;
    }

    public Map<String, String> getVitalSigns() {
        return vitalSigns;
    }

    public void setVitalSigns(Map<String, String> vitalSigns) {
        this.vitalSigns = vitalSigns;
    }

    public void addVitalSign(String name, String value) {
        this.vitalSigns.put(name, value);
    }

    public String getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public Instant getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(Instant recordDate) {
        this.recordDate = recordDate;
    }

    @Override
    public String toString() {
        return "MedicalRecord{" +
                "assetId='" + getAssetId() + '\'' +
                ", patientId='" + patientId + '\'' +
                ", providerId='" + providerId + '\'' +
                ", diagnosis='" + diagnosis + '\'' +
                ", recordDate=" + recordDate +
                ", encrypted=" + isEncrypted() +
                '}';
    }
}
