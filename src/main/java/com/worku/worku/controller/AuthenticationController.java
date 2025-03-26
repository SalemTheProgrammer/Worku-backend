package com.worku.worku.controller;

import com.worku.worku.dto.auth.*;
import com.worku.worku.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @Operation(
        summary = "Authenticate user",
        description = "Authenticate a user with email and password to receive JWT tokens"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Authentication successful",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = AuthenticationResponse.class),
                examples = @ExampleObject(
                    value = """
                    {
                        "access_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "token_type": "Bearer",
                        "expires_in": 86400,
                        "email": "user@example.com",
                        "firstName": "John",
                        "lastName": "Doe",
                        "role": "ROLE_COMPANY",
                        "userType": "COMPANY"
                    }
                    """
                )
            )
        ),
        @ApiResponse(responseCode = "401", description = "Invalid credentials"),
        @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody @Valid AuthenticationRequest request
    ) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }

    @Operation(
        summary = "Register company",
        description = "Register a new company account"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Registration successful",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = @ExampleObject(
                    value = """
                    {
                        "access_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "token_type": "Bearer",
                        "expires_in": 86400,
                        "email": "company@example.com",
                        "firstName": "John",
                        "lastName": "Doe",
                        "role": "ROLE_COMPANY",
                        "userType": "COMPANY"
                    }
                    """
                )
            )
        ),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    @PostMapping("/register/company")
    public ResponseEntity<AuthenticationResponse> registerCompany(
            @RequestBody @Valid RegisterCompanyRequest request
    ) {
        return ResponseEntity.ok(authenticationService.registerCompany(request));
    }

    @Operation(
        summary = "Register candidate",
        description = "Register a new candidate account"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Registration successful",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                examples = @ExampleObject(
                    value = """
                    {
                        "access_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
                        "token_type": "Bearer",
                        "expires_in": 86400,
                        "email": "candidate@example.com",
                        "firstName": "Jane",
                        "lastName": "Doe",
                        "role": "ROLE_CANDIDATE",
                        "userType": "CANDIDATE"
                    }
                    """
                )
            )
        ),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    @PostMapping("/register/candidate")
    public ResponseEntity<AuthenticationResponse> registerCandidate(
            @RequestBody @Valid RegisterCandidateRequest request
    ) {
        return ResponseEntity.ok(authenticationService.registerCandidate(request));
    }
}