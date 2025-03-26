package com.worku.worku.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Worku API Documentation")
                        .version("1.0")
                        .description("REST API documentation for Worku hiring platform")
                        .contact(new Contact()
                                .name("Worku Support")
                                .email("support@worku.com")
                                .url("https://worku.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }

    @Bean
    public ApiResponses customApiResponses() {
        return new ApiResponses()
                .addApiResponse("400", createApiResponse("Bad Request", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 400,\n  \"message\": \"Validation failed\",\n  \"errors\": {\n    \"email\": \"Invalid email format\",\n    \"password\": \"Password must contain at least 8 characters\"\n  }\n}"))
                .addApiResponse("401", createApiResponse("Unauthorized", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 401,\n  \"message\": \"Invalid credentials\"\n}"))
                .addApiResponse("403", createApiResponse("Forbidden", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 403,\n  \"message\": \"Access denied\"\n}"))
                .addApiResponse("404", createApiResponse("Not Found", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 404,\n  \"message\": \"Resource not found\"\n}"))
                .addApiResponse("409", createApiResponse("Conflict", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 409,\n  \"message\": \"Email already exists\"\n}"))
                .addApiResponse("500", createApiResponse("Internal Server Error", 
                    "{\n  \"timestamp\": \"2024-02-21T18:26:51\",\n  \"status\": 500,\n  \"message\": \"An unexpected error occurred\"\n}"));
    }

    private ApiResponse createApiResponse(String description, String exampleResponse) {
        Example example = new Example().value(exampleResponse);
        MediaType mediaType = new MediaType().addExamples("default", example);
        Content content = new Content().addMediaType("application/json", mediaType);
        return new ApiResponse().description(description).content(content);
    }
}