package com.worku.worku.service;

import com.worku.worku.exception.ResourceAlreadyExistsException;
import com.worku.worku.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ValidationService {

    private final UserRepository userRepository;

    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    private static final Pattern PASSWORD_PATTERN = 
        Pattern.compile("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$");
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("^\\+?[1-9][0-9]{7,14}$");

    public void validateEmail(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResourceAlreadyExistsException("User", "email", email);
        }
    }

    public void validatePassword(String password) {
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                "Password must contain at least 8 characters, including uppercase, lowercase, " +
                "numbers and special characters"
            );
        }
    }

    public void validatePhoneNumber(String phoneNumber) {
        if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
            throw new IllegalArgumentException(
                "Invalid phone number format. Please use international format (e.g., +1234567890)"
            );
        }
    }

    public void validateCompanyRegistration(String companyName, String industry) {
        if (companyName == null || companyName.trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }
        if (industry == null || industry.trim().isEmpty()) {
            throw new IllegalArgumentException("Industry is required");
        }
    }

    public void validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }

    public void validateUrl(String url, String fieldName) {
        if (url != null && !url.trim().isEmpty()) {
            try {
                new java.net.URL(url);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid " + fieldName + " URL format");
            }
        }
    }
}