# Upload Service Microservice

This is a Node.js (Express.js) microservice that acts as an intermediary for uploading files to S3-compatible storage services like Wasabi, AWS S3, etc. It generates presigned URLs for secure, direct client-side uploads.

## Features

-   **Generate Presigned URLs**: Creates a temporary, secure URL for a client to upload a file directly to the S3 bucket.
-   **Verify File Existence**: Checks if a file exists in the bucket and returns its metadata.
-   **Delete Files**: Deletes a specified file from the bucket.
-   **Webhook Notifications**: Sends success or error notifications to a specified webhook URL.
-   **Validation**: Enforces required fields and file size limits.
-   **Structured Error Handling**: Provides clear, structured error messages.

## Prerequisites

-   Node.js (v14 or later recommended)
-   npm

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd upload-service
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

No `.env` file is needed for this service. All S3 credentials and configuration details are passed directly in the body of each API request, allowing this service to be a stateless intermediary for multiple S3 buckets and accounts.

## Running the Service

To start the microservice, run the following command:

```bash
npm start
```

The server will start on port `3000` by default.

## API Endpoints

All endpoints are prefixed with `/api/v1/s3`.

---

### 1. `POST /upload`

Generates a presigned URL for a client to upload a file.

**Request Body:**

```json
{
  "fileName": "exemplo.png",
  "fileSize": 123456,
  "fileType": "image/png",
  "s3": {
    "accessKeyId": "YOUR_S3_ACCESS_KEY",
    "secretAccessKey": "YOUR_S3_SECRET_KEY",
    "bucket": "your-bucket-name",
    "region": "us-east-1",
    "endpoint": "https://s3.wasabisys.com"
  },
  "webhook": "https://your-server.com/webhook"
}
```

**Success Response (200 OK):**

```json
{
  "status": "success",
  "uploadUrl": "https://s3.wasabisys.com/your-bucket-name/uploads/uuid-exemplo.png?AWSAccessKeyId=...",
  "fileKey": "uploads/uuid-exemplo.png"
}
```

**Webhook Payloads:**

-   **On Success:** A `200 OK` response is sent to the client, and this webhook is triggered.
    ```json
    {
      "status": "success",
      "fileName": "exemplo.png",
      "fileKey": "uploads/uuid-exemplo.png",
      "fileSize": 123456,
      "bucket": "your-bucket-name"
    }
    ```
-   **On Error:** A `500` or `400` response is sent to the client, and this webhook is triggered.
    ```json
    {
      "status": "error",
      "error": "Detailed error message",
      "fileName": "exemplo.png"
    }
    ```

---

### 2. `POST /verify`

Verifies if a file exists in the bucket and returns its metadata.

**Request Body:**

```json
{
  "fileKey": "uploads/uuid-exemplo.png",
  "s3": {
    "accessKeyId": "YOUR_S3_ACCESS_KEY",
    "secretAccessKey": "YOUR_S3_SECRET_KEY",
    "bucket": "your-bucket-name",
    "region": "us-east-1",
    "endpoint": "https://s3.wasabisys.com"
  }
}
```

**Success Response (200 OK):**

```json
{
  "status": "success",
  "metadata": {
    "ETag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
    "LastModified": "2023-10-27T10:00:00.000Z",
    "Size": 123456
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "File not found"
}
```

---

### 3. `DELETE /file`

Deletes a file from the S3 bucket.

**Request Body:**

```json
{
  "fileKey": "uploads/uuid-exemplo.png",
  "s3": {
    "accessKeyId": "YOUR_S3_ACCESS_KEY",
    "secretAccessKey": "YOUR_S3_SECRET_KEY",
    "bucket": "your-bucket-name",
    "region": "us-east-1",
    "endpoint": "https://s3.wasabisys.com"
  }
}
```

**Success Response (200 OK):**

```json
{
  "status": "success",
  "message": "File deleted successfully"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "status": "error",
  "message": "Failed to delete file",
  "details": "..."
}
```
