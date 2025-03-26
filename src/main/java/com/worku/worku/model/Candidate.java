package com.worku.worku.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@Table(name = "candidates")
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@DiscriminatorValue("CANDIDATE")
public class Candidate extends User {

    @Column(length = 1000)
    private String bio;

    @Column(length = 500)
    private String skills;

    @Column
    private String currentPosition;

    @Column
    private String education;

    @Column
    private String experience;

    @Column
    private String resumeUrl;

    @Column
    private String linkedinUrl;

    @Column
    private String githubUrl;

    @Column
    private String portfolioUrl;

    @Builder.Default
    private boolean available = true;
}