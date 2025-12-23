package io.aurigraph.v11.token.secondary;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Secondary Token Version DTO
 *
 * Response DTO for version API endpoints.
 * Serializes version data for REST API responses.
 *
 * @version 12.0.0
 * @since December 23, 2025
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecondaryTokenVersionDTO {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("secondaryTokenId")
    private UUID secondaryTokenId;

    @JsonProperty("versionNumber")
    private Integer versionNumber;

    @JsonProperty("content")
    private String content;

    @JsonProperty("merkleHash")
    private String merkleHash;

    @JsonProperty("status")
    private String status;

    @JsonProperty("previousVersionId")
    private UUID previousVersionId;

    @JsonProperty("replacedAt")
    private LocalDateTime replacedAt;

    @JsonProperty("replacedByVersionId")
    private UUID replacedByVersionId;

    @JsonProperty("vvbRequired")
    private Boolean vvbRequired;

    @JsonProperty("vvbApprovedAt")
    private LocalDateTime vvbApprovedAt;

    @JsonProperty("vvbApprovedBy")
    private String vvbApprovedBy;

    @JsonProperty("rejectionReason")
    private String rejectionReason;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    @JsonProperty("archivedAt")
    private LocalDateTime archivedAt;

    /**
     * Convert from entity to DTO
     */
    public static SecondaryTokenVersionDTO fromEntity(SecondaryTokenVersion entity) {
        return SecondaryTokenVersionDTO.builder()
                .id(entity.getId())
                .secondaryTokenId(entity.getSecondaryTokenId())
                .versionNumber(entity.getVersionNumber())
                .content(entity.getContent())
                .merkleHash(entity.getMerkleHash())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .previousVersionId(entity.getPreviousVersionId())
                .replacedAt(entity.getReplacedAt())
                .replacedByVersionId(entity.getReplacedByVersionId())
                .vvbRequired(entity.getVvbRequired())
                .vvbApprovedAt(entity.getVvbApprovedAt())
                .vvbApprovedBy(entity.getVvbApprovedBy())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .archivedAt(entity.getArchivedAt())
                .build();
    }
}
