# Application Module API Documentation

This document provides a detailed overview of the API endpoints available in the Application module.

## Base URL

All endpoints are prefixed with `/applications`.

## Authentication

All endpoints require a valid JWT token in the `Authorization` header.

## Endpoints

### 1. Submit job application (POST /applications)

*   **Summary:** Submits a new job application.
*   **Description:** Creates a new job application and triggers a CV analysis process.
*   **Request Body:**

    ```json
    {
      "jobId": "507f1f77bcf86cd799439011"
    }
    ```
*   **Request Body Parameters:**
    *   `jobId` (string, required): The ID of the job posting to which the application is being submitted.
*   **Responses:**
    *   **201 Created:** Application submitted successfully.

        ```json
        {
          "id": "507f1f77bcf86cd799439013"
        }
        ```

        *   `id` (string): The ID of the created application.
    *   **400 Bad Request:** Invalid input or CV not found.
    *   **401 Unauthorized:** Invalid token.
    *   **429 Too Many Requests:** Rate limit exceeded.
*   **Example Usage:**

    ```bash
    curl -X POST \
      http://localhost:3000/applications \
      -H 'Authorization: Bearer <JWT_TOKEN>' \
      -H 'Content-Type: application/json' \
      -d '{
        "jobId": "507f1f77bcf86cd799439011"
      }'
    ```

### 2. Get application details (GET /applications/:id)

*   **Summary:** Retrieves detailed information about a specific application.
*   **Description:** Returns the details of an application, including candidate and job information.
*   **Path Parameters:**
    *   `id` (string, required): The ID of the application to retrieve. Example: `507f1f77bcf86cd799439011`.
*   **Responses:**
    *   **200 OK:** Application details retrieved successfully. (Response schema depends on the `ApplicationDocument` schema.)
    *   **401 Unauthorized:** Invalid token.
    *   **403 Forbidden:** Not the owner of the application.
    *   **404 Not Found:** Application not found.
*   **Example Usage:**

    ```bash
    curl -X GET \
      http://localhost:3000/applications/507f1f77bcf86cd799439011 \
      -H 'Authorization: Bearer <JWT_TOKEN>'
    ```

### 3. Get candidate applications (GET /applications/candidate/applications)

*   **Summary:** Retrieves all applications submitted by the authenticated candidate.
*   **Description:** Returns a list of applications submitted by the currently logged-in candidate.
*   **Responses:**
    *   **200 OK:** Applications retrieved successfully. (Response schema is an array of `ApplicationDocument`.)
    *   **401 Unauthorized:** Invalid token.
*   **Example Usage:**

    ```bash
    curl -X GET \
      http://localhost:3000/applications/candidate/applications \
      -H 'Authorization: Bearer <JWT_TOKEN>'
    ```

### 4. Get company applications (GET /applications/company/:companyId)

*   **Summary:** Retrieves all applications received by a specific company.
*   **Description:** Returns a list of applications submitted to jobs posted by a specific company.
*   **Path Parameters:**
    *   `companyId` (string, required): The ID of the company. Example: `507f1f77bcf86cd799439012`.
*   **Responses:**
    *   **200 OK:** Company applications retrieved successfully. (Response schema is an array of `ApplicationDocument`.)
    *   **401 Unauthorized:** Invalid token.
    *   **403 Forbidden:** Access restricted to company users.
*   **Example Usage:**

    ```bash
    curl -X GET \
      http://localhost:3000/applications/company/507f1f77bcf86cd799439012 \
      -H 'Authorization: Bearer <JWT_TOKEN>'