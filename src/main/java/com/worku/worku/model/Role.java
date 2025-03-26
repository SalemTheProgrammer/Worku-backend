package com.worku.worku.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@Table(name = "roles")
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String description;

    public static Role createRole(String name) {
        return Role.builder()
                .name(name)
                .description("Role for " + name.substring(5).toLowerCase())
                .build();
    }

    public enum RoleType {
        ROLE_ADMIN,
        ROLE_COMPANY,
        ROLE_CANDIDATE
    }
}