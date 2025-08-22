# S3 Upload Proxy Microservice

This is a Node.js (Express.js) microservice that acts as a secure and efficient intermediary for uploading files to S3-compatible storage.

Instead of generating S3 credentials, this service receives a pre-generated S3 presigned URL and provides a temporary, local proxy URL. The client then uploads the file to the microservice, which streams it asynchronously to S3. This approach enhances security by hiding the final S3 URL from the client and allows for server-side validation and control.

## Core Workflow

1.  **Generate Proxy URL**: Your backend generates an S3 presigned URL and sends it to this microservice's `/generate` endpoint. The microservice stores this URL and returns a temporary, unique proxy URL (e.g., `/upload/some-unique-id`).
2.  **Client Upload**: The client uploads the file directly to the proxy URL provided in step 1.
3.  **Proxy and Webhook**: The microservice receives the file, immediately confirms receipt to the client (`200 OK`), and begins streaming the file to the S3 presigned URL in the background. Once the background upload is complete (or fails), it sends a status notification to your backend via a webhook.

## Features

-   **Asynchronous Upload Proxy**: Decouples the client from the S3 upload process.
-   **Streaming**: Handles large files with low memory overhead by streaming data instead of storing it.
-   **In-Memory Session Management**: Temporarily tracks upload sessions (for production, use Redis or similar).
-   **Dynamic Validation**: Enforces file size limits specified during URL generation.
-   **Webhook Notifications**: Informs your backend about the final status of the S3 upload.

## Prerequisites

-   Node.js (v14 or later recommended)
-   npm

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd s3-upload-proxy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Service

To start the microservice, run the following command:

```bash
npm start
```

The server will start on port `3000` by default.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

---

### 1. `POST /generate`

Registers a new upload session and generates a temporary proxy URL.

**Request Body:**

```json
{
  "fileKey": "uploads/user/avatar.png",
  "maxSize": 10485760,
  "s3PresignedUrl": "https://your-bucket.s3.wasabisys.com/...?signature...",
  "webhook": "https://your-backend.com/webhook/upload-confirm"
}
```

**Success Response (200 OK):**

```json
{
  "status": "success",
  "uploadUrl": "http://localhost:3000/api/v1/upload/a1b2c3d4-e5f6-...",
  "fileKey": "uploads/user/avatar.png"
}
```

---

### 2. `POST /upload/:id`

The endpoint where the client uploads the file using `multipart/form-data`.

**Request:**

The client should send a `POST` request with the file in the body as `multipart/form-data`.

**Success Response (200 OK):**

The client receives this response *immediately* after the file is received by the proxy service. The upload to S3 continues in the background.

```json
{
  "status": "success",
  "message": "Upload received and is being processed."
}
```

**Webhook Payloads:**

After the background upload to S3 is complete, the microservice sends one of the following payloads to the `webhook` URL provided during the `/generate` call.

-   **On Success:**
    ```json
    {
      "status": "success",
      "fileKey": "uploads/user/avatar.png",
      "size": 987654
    }
    ```
-   **On Error:**
    ```json
    {
      "status": "error",
      "fileKey": "uploads/user/avatar.png",
      "error": "S3 upload failed: Request failed with status code 403"
    }
    ```
