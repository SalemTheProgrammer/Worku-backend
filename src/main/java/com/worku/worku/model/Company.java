package com.worku.worku.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "companies")
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@DiscriminatorValue("COMPANY")
public class Company extends User {

    @Column(nullable = false)
    private String companyName;

    @Column
    private String website;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String industry;

    @Column
    private String size;

    @Column
    private String location;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<User> companyUsers = new HashSet<>();

    @Builder.Default
    private boolean verified = false;
}