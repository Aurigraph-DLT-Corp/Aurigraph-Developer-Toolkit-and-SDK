package io.aurigraph.v11.portal;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Enterprise Setting Entity
 * Persistent configuration stored in PostgreSQL
 */
@Entity
@Table(name = "enterprise_settings")
public class EnterpriseSetting extends PanacheEntityBase {

    @Id
    @Column(length = 64)
    public String category;

    @Column(name = "settings_json", columnDefinition = "TEXT")
    public String settingsJson;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    public EnterpriseSetting() {
    }

    public EnterpriseSetting(String category, String settingsJson) {
        this.category = category;
        this.settingsJson = settingsJson;
        this.updatedAt = LocalDateTime.now();
    }
}
