# Worku - Hiring Platform API

A high-end authentication and authorization system for a hiring platform built with Spring Boot, Spring Security, JWT, and MySQL.

## Features

- Secure authentication with JWT tokens
- Role-based authorization (Company and Candidate)
- Company and Candidate registration and management
- Password encryption with BCrypt
- Email validation
- Phone number validation
- Input validation and error handling
- API documentation with OpenAPI/Swagger
- Unit and integration tests
- MySQL database integration
- Token refresh mechanism
- Audit logging for entities

## Technology Stack

- Java 17
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- MySQL 8
- JWT (JSON Web Tokens)
- Swagger/OpenAPI
- Maven
- JUnit 5
- H2 Database (for testing)
- Lombok

## Prerequisites

- Java 17 or higher
- MySQL 8
- Maven

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/worku.git
cd worku
```

2. Configure MySQL database in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/worku?createDatabaseIfNotExist=true
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

The application will start on http://localhost:8080

## API Documentation

After starting the application, you can access the API documentation at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## API Endpoints

### Authentication

```
POST /api/v1/auth/register/company    - Register a new company
POST /api/v1/auth/register/candidate  - Register a new candidate
POST /api/v1/auth/login              - Authenticate user
```

### Request Examples

#### Register Company
```json
{
  "companyName": "Tech Corp",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@techcorp.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "industry": "Technology",
  "website": "https://techcorp.com",
  "description": "Leading tech company",
  "size": "50-200",
  "location": "New York"
}
```

#### Register Candidate
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@email.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "bio": "Experienced software engineer",
  "skills": "Java, Spring Boot, React",
  "currentPosition": "Senior Developer",
  "education": "BSc Computer Science",
  "experience": "5 years",
  "linkedinUrl": "https://linkedin.com/in/janesmith"
}
```

#### Login
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

## Security

- Password Requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

- JWT Token Configuration:
  - Access Token validity: 24 hours
  - Refresh Token validity: 7 days

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

```json
{
  "timestamp": "2024-02-21T18:26:51",
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must contain at least 8 characters"
  }
}
```

## Testing

Run tests with:
```bash
mvn test
```

The project includes:
- Unit tests
- Integration tests
- Authentication tests
- Validation tests

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.