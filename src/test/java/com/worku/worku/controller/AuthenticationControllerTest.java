package com.worku.worku.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worku.worku.dto.auth.AuthenticationRequest;
import com.worku.worku.dto.auth.RegisterCompanyRequest;
import com.worku.worku.dto.auth.RegisterCandidateRequest;
import com.worku.worku.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void whenRegisterCompany_thenReturnAuthResponse() throws Exception {
        RegisterCompanyRequest request = RegisterCompanyRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("company@test.com")
                .password("Test123@password")
                .phoneNumber("+1234567890")
                .companyName("Test Company")
                .industry("Technology")
                .website("https://testcompany.com")
                .build();

        ResultActions response = mockMvc.perform(post("/api/v1/auth/register/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(request.getEmail()))
                .andExpect(jsonPath("$.firstName").value(request.getFirstName()))
                .andExpect(jsonPath("$.lastName").value(request.getLastName()))
                .andExpect(jsonPath("$.role").value("ROLE_COMPANY"))
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists());
    }

    @Test
    void whenRegisterCandidate_thenReturnAuthResponse() throws Exception {
        RegisterCandidateRequest request = RegisterCandidateRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .email("candidate@test.com")
                .password("Test123@password")
                .phoneNumber("+1234567890")
                .skills("Java, Spring Boot")
                .currentPosition("Software Engineer")
                .build();

        ResultActions response = mockMvc.perform(post("/api/v1/auth/register/candidate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(request.getEmail()))
                .andExpect(jsonPath("$.firstName").value(request.getFirstName()))
                .andExpect(jsonPath("$.lastName").value(request.getLastName()))
                .andExpect(jsonPath("$.role").value("ROLE_CANDIDATE"))
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists());
    }

    @Test
    void whenAuthenticate_withValidCredentials_thenReturnAuthResponse() throws Exception {
        // First register a user
        RegisterCompanyRequest registerRequest = RegisterCompanyRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("auth@test.com")
                .password("Test123@password")
                .phoneNumber("+1234567890")
                .companyName("Test Company")
                .industry("Technology")
                .build();

        mockMvc.perform(post("/api/v1/auth/register/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // Then try to authenticate
        AuthenticationRequest authRequest = AuthenticationRequest.builder()
                .email("auth@test.com")
                .password("Test123@password")
                .build();

        ResultActions response = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)));

        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(authRequest.getEmail()))
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists());
    }

    @Test
    void whenAuthenticate_withInvalidCredentials_thenReturn401() throws Exception {
        AuthenticationRequest request = AuthenticationRequest.builder()
                .email("invalid@test.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}