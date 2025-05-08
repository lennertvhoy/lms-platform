# API Tests

This document outlines initial test cases for the LMS Platform API endpoints, using markdown for clarity.

## Hello Endpoint

### GET /api/hello
- **Request:** GET http://localhost:7071/api/hello
- **Expected Response:**
  - Status: 200
  - Body: `"Hello from Azure Functions!"`

## Courses Endpoint

### GET /api/courses
- **Request:** GET http://localhost:7071/api/courses
- **Expected Response:**
  - Status: 200
  - Body: Array of courses, each containing:
    - `id` (number)
    - `title` (string)
    - `isPublished` (boolean)

### GET /api/courses/{id}
- **Request:** GET http://localhost:7071/api/courses/1
- **Expected Response:**
  - Status: 200 if course exists, 404 otherwise
  - Body (200): Course object with:
    - `id`, `title`, `description`, `isPublished`
    - `modules` (array of module objects)

### POST /api/courses
- **Request:** POST http://localhost:7071/api/courses
  ```json
  {
    "title": "New Course",
    "description": "Description of the new course"
  }
  ```
- **Expected Response:**
  - Status: 201 for successful creation, 400 if `title` is missing
  - Body: Created course object with `id`, `title`, `description`, `isPublished`

### PUT /api/courses/{id}
- **Request:** PUT http://localhost:7071/api/courses/1
  ```json
  {
    "title": "Updated Course Title",
    "description": "Updated description",
    "isPublished": true
  }
  ```
- **Expected Response:**
  - Status: 200 if updated successfully
  - Body: Updated course object

### DELETE /api/courses/{id}
- **Request:** DELETE http://localhost:7071/api/courses/1
- **Expected Response:**
  - Status: 204 for successful deletion

## Quiz Endpoint

### POST /api/quiz
- **Request:** POST http://localhost:7071/api/quiz
  ```json
  {
    "content": "Chapter 1 content: Introduction to LMS features."
  }
  ```
- **Expected Response:**
  - Status: 200 if `content` provided, 400 otherwise
  - Body: Quiz questions text (markdown-compatible)

## Modules Endpoint

### GET /api/modules
- **Request:** GET http://localhost:7071/api/modules
- **Expected Response:**
  - Status: 200
  - Body: Array of modules, each containing:
    - `id` (number)
    - `courseId` (number)
    - `title` (string)
    - `content` (string | null)
    - `orderIndex` (number)

### GET /api/modules/{id}
- **Request:** GET http://localhost:7071/api/modules/1
- **Expected Response:**
  - Status: 200 if module exists, 404 otherwise
  - Body: Module object with `id`, `courseId`, `title`, `content`, `orderIndex`

### POST /api/modules
- **Request:** POST http://localhost:7071/api/modules
  ```json
  {
    "courseId": 1,
    "title": "Module Title",
    "content": "Module content details",
    "orderIndex": 2
  }
  ```
- **Expected Response:**
  - Status: 201 for successful creation, 400 if `courseId` or `title` is missing
  - Body: Created module object

### PUT /api/modules/{id}
- **Request:** PUT http://localhost:7071/api/modules/1
  ```json
  {
    "courseId": 1,
    "title": "Updated Module Title",
    "content": "Updated content",
    "orderIndex": 3
  }
  ```
- **Expected Response:**
  - Status: 200
  - Body: Updated module object

### DELETE /api/modules/{id}
- **Request:** DELETE http://localhost:7071/api/modules/1
- **Expected Response:**
  - Status: 204

## Enrollments Endpoint

### GET /api/enrollments
- **Request:** GET http://localhost:7071/api/enrollments
- **Expected Response:**
  - Status: 200
  - Body: Array of enrollment objects, each with `userId`, `courseId`, `enrolledAt`

### GET /api/enrollments/{userId}
- **Request:** GET http://localhost:7071/api/enrollments/user-uuid-123
- **Expected Response:**
  - Status: 200
  - Body: Array of enrollment objects for that user

### POST /api/enrollments
- **Request:** POST http://localhost:7071/api/enrollments
  ```json
  {
    "userId": "user-uuid-123",
    "courseId": 1
  }
  ```
- **Expected Response:**
  - Status: 201 for successful creation, 400 if `userId` or `courseId` is missing
  - Body: Created enrollment object

## Progress Endpoint

### GET /api/progress
- **Request:** GET http://localhost:7071/api/progress
- **Expected Response:**
  - Status: 200
  - Body: Array of progress entries, each with `userId`, `moduleId`, `status`, `score`, `updatedAt`

### GET /api/progress/{userId}
- **Request:** GET http://localhost:7071/api/progress/user-uuid-123
- **Expected Response:**
  - Status: 200
  - Body: Array of progress entries for that user

### GET /api/progress/{userId}?moduleId={moduleId}
- **Request:** GET http://localhost:7071/api/progress/user-uuid-123?moduleId=1
- **Expected Response:**
  - Status: 200
  - Body: Single progress entry for that user and module
  - 404 if not found

### POST /api/progress
- **Request:** POST http://localhost:7071/api/progress
  ```json
  {
    "userId": "user-uuid-123",
    "moduleId": 1,
    "status": "completed",
    "score": 95.5
  }
  ```
- **Expected Response:**
  - Status: 201 for create, 200 for update
  - Body: Upserted progress entry

## Users Endpoint

### GET /api/users
- **Request:** GET http://localhost:7071/api/users
- **Expected Response:**
  - Status: 200
  - Body: Array of users, each containing:
    - `id` (string)
    - `name` (string)
    - `email` (string)
    - `role` (string)

### GET /api/users/{id}
- **Request:** GET http://localhost:7071/api/users/{userId}
- **Expected Response:**
  - Status: 200 if user exists, 404 otherwise
  - Body: User object with `id`, `name`, `email`, `role`, and `enrollments`

### POST /api/users
- **Request:** POST http://localhost:7071/api/users
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student"
  }
  ```
- **Expected Response:**
  - Status: 201 for successful creation, 400 if missing fields or email conflict
  - Body: Created user object

---

*More test cases will be added as new endpoints (lessons, tests) are implemented.* 