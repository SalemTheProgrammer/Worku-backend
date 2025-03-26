package com.worku.worku.service;

import com.worku.worku.dto.auth.*;
import com.worku.worku.exception.ResourceNotFoundException;
import com.worku.worku.model.*;
import com.worku.worku.repository.RoleRepository;
import com.worku.worku.repository.UserRepository;
import com.worku.worku.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ValidationService validationService;

    @Transactional
    public AuthenticationResponse registerCompany(RegisterCompanyRequest request) {
        // Validate input
        validationService.validateEmail(request.getEmail());
        validationService.validatePassword(request.getPassword());
        validationService.validatePhoneNumber(request.getPhoneNumber());
        validationService.validateCompanyRegistration(request.getCompanyName(), request.getIndustry());
        if (request.getWebsite() != null) {
            validationService.validateUrl(request.getWebsite(), "website");
        }

        Role companyRole = getOrCreateRole(Role.RoleType.ROLE_COMPANY);

        Company company = Company.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .companyName(request.getCompanyName())
                .industry(request.getIndustry())
                .website(request.getWebsite())
                .description(request.getDescription())
                .size(request.getSize())
                .location(request.getLocation())
                .roles(new HashSet<>(Set.of(companyRole)))
                .enabled(true)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .build();

        var savedUser = userRepository.save(company);
        return generateAuthTokens(savedUser);
    }

    @Transactional
    public AuthenticationResponse registerCandidate(RegisterCandidateRequest request) {
        // Validate input
        validationService.validateEmail(request.getEmail());
        validationService.validatePassword(request.getPassword());
        validationService.validatePhoneNumber(request.getPhoneNumber());
        validationService.validateRequired(request.getFirstName(), "First name");
        validationService.validateRequired(request.getLastName(), "Last name");

        Role candidateRole = getOrCreateRole(Role.RoleType.ROLE_CANDIDATE);

        Candidate candidate = Candidate.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .bio(request.getBio())
                .skills(request.getSkills())
                .currentPosition(request.getCurrentPosition())
                .education(request.getEducation())
                .experience(request.getExperience())
                .resumeUrl(request.getResumeUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .githubUrl(request.getGithubUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .roles(new HashSet<>(Set.of(candidateRole)))
                .enabled(true)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .build();

        var savedUser = userRepository.save(candidate);
        return generateAuthTokens(savedUser);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        
        return generateAuthTokens(user);
    }

    private Role getOrCreateRole(Role.RoleType roleType) {
        return roleRepository.findByName(roleType.name())
                .orElseGet(() -> {
                    Role role = Role.builder()
                            .name(roleType.name())
                            .description("Role for " + roleType.name().substring(5).toLowerCase())
                            .build();
                    return roleRepository.save(role);
                });
    }

    private AuthenticationResponse generateAuthTokens(User user) {
        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRoles().iterator().next().getName())
                .userType(user.getClass().getSimpleName().toUpperCase())
                .build();
    }
}