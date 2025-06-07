# 🏢 New Company Routes API Documentation

## Overview
Two new public API routes have been added to provide access to company data and their job postings with advanced filtering and pagination capabilities.

---

## 📋 **Route 1: Get All Companies**

### **Endpoint**
```
GET /companies
```

### **Description**
Retrieve a paginated list of all verified companies with their basic information, location, logo, and job statistics.

### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of companies per page (max 100) |
| `skip` | number | No | 0 | Number of companies to skip for pagination |
| `search` | string | No | - | Search by company name (case-insensitive) |
| `sector` | string | No | - | Filter by business sector (case-insensitive) |
| `size` | string | No | - | Filter by company size |
| `location` | string | No | - | Filter by location (city, region, or country) |
| `sortBy` | string | No | createdAt | Sort field: `name`, `createdAt`, `jobCount` |
| `sortOrder` | string | No | desc | Sort order: `asc` or `desc` |

### **Example Requests**

#### Get first page of companies
```bash
GET /companies?limit=10&skip=0
```

#### Search for tech companies in Paris
```bash
GET /companies?search=tech&location=Paris&limit=20
```

#### Get companies sorted by job count
```bash
GET /companies?sortBy=jobCount&sortOrder=desc&limit=15
```

### **Response Format**

```json
{
  "companies": [
    {
      "id": "507f1f77bcf86cd799439011",
      "nomEntreprise": "TechCorp Solutions",
      "email": "contact@techcorp.com",
      "secteurActivite": "Technologies de l'information",
      "tailleEntreprise": "50-200",
      "location": "Paris, Île-de-France, France",
      "logo": "/uploads/company-logo-123.png",
      "description": "Leading software development company...",
      "siteWeb": "https://techcorp.com",
      "phone": "+33 1 23 45 67 89",
      "reseauxSociaux": {
        "linkedin": "https://linkedin.com/company/techcorp",
        "instagram": "https://instagram.com/techcorp",
        "facebook": "https://facebook.com/techcorp",
        "x": "https://x.com/techcorp"
      },
      "verified": true,
      "profileCompleted": true,
      "activeJobsCount": 5,
      "totalJobsCount": 12,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLoginAt": "2024-12-01T15:45:00.000Z"
    }
  ],
  "total": 150,
  "limit": 10,
  "skip": 0,
  "hasMore": true
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `companies` | array | Array of company objects |
| `companies[].id` | string | Company unique identifier |
| `companies[].nomEntreprise` | string | Company name |
| `companies[].email` | string | Company contact email |
| `companies[].secteurActivite` | string | Business sector |
| `companies[].tailleEntreprise` | string | Company size category |
| `companies[].location` | string | Formatted location (city, region, country) |
| `companies[].logo` | string | Logo file path (null if no logo) |
| `companies[].description` | string | Company description |
| `companies[].siteWeb` | string | Website URL |
| `companies[].phone` | string | Contact phone number |
| `companies[].reseauxSociaux` | object | Social media links |
| `companies[].verified` | boolean | Company verification status |
| `companies[].profileCompleted` | boolean | Profile completion status |
| `companies[].activeJobsCount` | number | Number of currently active jobs |
| `companies[].totalJobsCount` | number | Total number of jobs posted |
| `companies[].createdAt` | string | Company registration date |
| `companies[].lastLoginAt` | string | Last login timestamp |
| `total` | number | Total number of companies matching filters |
| `limit` | number | Number of companies per page |
| `skip` | number | Number of companies skipped |
| `hasMore` | boolean | Whether more companies are available |

---

## 📋 **Route 2: Get Company Jobs**

### **Endpoint**
```
GET /companies/:companyId/jobs
```

### **Description**
Retrieve all jobs (including expired ones) posted by a specific company with advanced filtering and pagination.

### **Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | string | Yes | Company MongoDB ObjectId (24 characters) |

### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of jobs per page (max 100) |
| `skip` | number | No | 0 | Number of jobs to skip for pagination |
| `search` | string | No | - | Search by job title (case-insensitive) |
| `onlyActive` | boolean | No | false | Show only active jobs |
| `onlyExpired` | boolean | No | false | Show only expired jobs |
| `contractType` | string | No | - | Filter by contract type |
| `sortBy` | string | No | publishedAt | Sort field: `publishedAt`, `expiresAt`, `title`, `applicationsCount` |
| `sortOrder` | string | No | desc | Sort order: `asc` or `desc` |

### **Example Requests**

#### Get all jobs for a company
```bash
GET /companies/507f1f77bcf86cd799439011/jobs
```

#### Get only active jobs
```bash
GET /companies/507f1f77bcf86cd799439011/jobs?onlyActive=true&limit=15
```

#### Get expired jobs sorted by expiration date
```bash
GET /companies/507f1f77bcf86cd799439011/jobs?onlyExpired=true&sortBy=expiresAt&sortOrder=asc
```

#### Search for developer jobs
```bash
GET /companies/507f1f77bcf86cd799439011/jobs?search=developer&limit=10
```

### **Response Format**

```json
{
  "jobs": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Senior Full-Stack Developer",
      "description": "We are looking for an experienced developer...",
      "domain": "Technologies de l'information",
      "location": "Paris, France",
      "contractType": "CDI",
      "remote": true,
      "salaryMin": 50000,
      "salaryMax": 70000,
      "showSalary": true,
      "currency": "EUR",
      "experienceMin": 3,
      "experienceMax": 7,
      "educationLevel": "Bac+5",
      "languages": ["Français", "Anglais"],
      "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
      "responsibilities": [
        "Develop and maintain web applications",
        "Collaborate with design team"
      ],
      "requirements": [
        "3+ years experience in web development",
        "Strong knowledge of JavaScript"
      ],
      "benefits": [
        "Health insurance",
        "Remote work",
        "Professional development budget"
      ],
      "isActive": true,
      "publishedAt": "2024-11-15T09:00:00.000Z",
      "expiresAt": "2024-12-15T23:59:59.000Z",
      "applicationsCount": 25,
      "viewsCount": 150,
      "createdAt": "2024-11-15T09:00:00.000Z",
      "updatedAt": "2024-11-20T14:30:00.000Z"
    }
  ],
  "total": 12,
  "limit": 20,
  "skip": 0,
  "hasMore": false,
  "summary": {
    "activeJobs": 5,
    "expiredJobs": 7,
    "totalApplications": 145,
    "totalViews": 1250
  }
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `jobs` | array | Array of job objects |
| `jobs[].id` | string | Job unique identifier |
| `jobs[].title` | string | Job title |
| `jobs[].description` | string | Job description |
| `jobs[].domain` | string | Job domain/sector |
| `jobs[].location` | string | Job location |
| `jobs[].contractType` | string | Contract type (CDI, CDD, etc.) |
| `jobs[].remote` | boolean | Remote work availability |
| `jobs[].salaryMin` | number | Minimum salary |
| `jobs[].salaryMax` | number | Maximum salary |
| `jobs[].showSalary` | boolean | Whether salary is displayed |
| `jobs[].currency` | string | Salary currency |
| `jobs[].experienceMin` | number | Minimum experience required (years) |
| `jobs[].experienceMax` | number | Maximum experience required (years) |
| `jobs[].educationLevel` | string | Required education level |
| `jobs[].languages` | array | Required languages |
| `jobs[].skills` | array | Required skills |
| `jobs[].responsibilities` | array | Job responsibilities |
| `jobs[].requirements` | array | Job requirements |
| `jobs[].benefits` | array | Job benefits |
| `jobs[].isActive` | boolean | Job active status |
| `jobs[].publishedAt` | string | Publication date |
| `jobs[].expiresAt` | string | Expiration date |
| `jobs[].applicationsCount` | number | Number of applications received |
| `jobs[].viewsCount` | number | Number of job views |
| `jobs[].createdAt` | string | Job creation date |
| `jobs[].updatedAt` | string | Last update date |
| `total` | number | Total jobs matching filters |
| `limit` | number | Jobs per page |
| `skip` | number | Jobs skipped |
| `hasMore` | boolean | More jobs available |
| `summary` | object | Company job statistics |
| `summary.activeJobs` | number | Number of active jobs |
| `summary.expiredJobs` | number | Number of expired jobs |
| `summary.totalApplications` | number | Total applications across all jobs |
| `summary.totalViews` | number | Total views across all jobs |

---

## 📋 **Route 3: Get Company Details**

### **Endpoint**
```
GET /companies/:companyId
```

### **Description**
Retrieve detailed information about a specific company including job statistics.

### **Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | string | Yes | Company MongoDB ObjectId (24 characters) |

### **Example Request**

```bash
GET /companies/507f1f77bcf86cd799439011
```

### **Response Format**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "nomEntreprise": "TechCorp Solutions",
    "email": "contact@techcorp.com",
    "secteurActivite": "Technologies de l'information",
    "tailleEntreprise": "50-200",
    "location": "Paris, Île-de-France, France",
    "logo": "/uploads/company-logo-123.png",
    "description": "Leading software development company...",
    "siteWeb": "https://techcorp.com",
    "phone": "+33 1 23 45 67 89",
    "reseauxSociaux": {
      "linkedin": "https://linkedin.com/company/techcorp",
      "instagram": "https://instagram.com/techcorp",
      "facebook": "https://facebook.com/techcorp",
      "x": "https://x.com/techcorp"
    },
    "verified": true,
    "profileCompleted": true,
    "activeJobsCount": 5,
    "totalJobsCount": 12,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastLoginAt": "2024-12-01T15:45:00.000Z"
  }
}
```

---

## 🚨 **Error Responses**

### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Invalid company ID format",
  "error": "Bad Request"
}
```

### **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Company not found",
  "error": "Not Found"
}
```

### **500 Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Failed to fetch companies",
  "error": "Internal Server Error"
}
```

---

## 📝 **Usage Examples**

### **Frontend Integration**

#### React/JavaScript Example
```javascript
// Get companies with search and pagination
const fetchCompanies = async (page = 0, search = '') => {
  const response = await fetch(
    `/api/companies?limit=20&skip=${page * 20}&search=${search}`
  );
  return response.json();
};

// Get company jobs
const fetchCompanyJobs = async (companyId, onlyActive = false) => {
  const response = await fetch(
    `/api/companies/${companyId}/jobs?onlyActive=${onlyActive}&limit=50`
  );
  return response.json();
};
```

#### Advanced Filtering Example
```javascript
// Get tech companies in Paris with active jobs
const fetchTechCompaniesInParis = async () => {
  const response = await fetch(
    '/api/companies?sector=Technologies&location=Paris&sortBy=jobCount&sortOrder=desc'
  );
  return response.json();
};
```

### **Analytics Use Cases**

1. **Company Directory**: Build a searchable company directory
2. **Job Market Analysis**: Analyze job trends by company
3. **Recruitment Insights**: Track company hiring patterns
4. **Company Profiles**: Display detailed company information
5. **Expired Job Analytics**: Analyze past job postings

---

## 🔧 **Performance Features**

- **Optimized Queries**: Uses MongoDB aggregation for better performance
- **Efficient Pagination**: Server-side pagination with skip/limit
- **Smart Caching**: Results can be cached for better response times
- **Parallel Processing**: Multiple database operations run in parallel
- **Index Support**: Optimized for database indexes on search fields

---

## 🛡️ **Security & Validation**

- **Input Validation**: All query parameters are validated
- **Rate Limiting**: Standard rate limiting applies
- **Data Sanitization**: Search queries are sanitized
- **Public Access**: No authentication required (public data only)
- **Verified Companies**: Only shows verified companies

---

## 💡 **Best Practices**

1. **Pagination**: Always use pagination for large datasets
2. **Caching**: Cache results on the frontend for better UX
3. **Error Handling**: Implement proper error handling
4. **Loading States**: Show loading indicators during API calls
5. **Filtering**: Use specific filters to reduce data transfer
6. **Sorting**: Utilize sorting options for better user experience

These new routes provide comprehensive access to company data and job postings, enabling rich applications and analytics while maintaining performance and security.