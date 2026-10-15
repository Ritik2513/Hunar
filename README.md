# Hunar AI — Candidate Communication Platform

A full-stack candidate communication platform built as part of the Hunar AI coding assignment. Recruiters can manage candidates, send individual or bulk messages, and review communication history with message delivery statuses.

## Features

- **Candidate management:** Create, list, search, view, and delete candidates.
- **Individual messaging:** Compose and send messages to a selected candidate.
- **Bulk messaging:** Process recipients independently so one failure does not stop other recipients.
- **Dummy communication provider:** A separate service that simulates message submission and provider outcomes.
- **Message lifecycle:** Track message states such as Sending, Sent, Delivered, Read, and Failed, where supported by the provider.
- **Communication history:** View previous messages, timestamps, and statuses for each candidate.
- **Failure handling:** Display unsuccessful sends and support retries where eligible.
- **Input validation:** Validate incoming API requests and return meaningful errors.

> This project uses a dummy communication provider. Messages are simulated; they are not actually delivered through an email or SMS gateway.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend API | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Provider | Separate Node.js service communicating over HTTP |
| API testing | Postman |
| Version control | Git and GitHub |

## Architecture

The application consists of three independently started applications.

```text
Recruiter
   |
   v
React + TypeScript frontend
   |
   | HTTP requests
   v
Express backend API
   |
   +------> MongoDB Atlas
   |         Candidates
   |         Communications
   |         Provider events
   |
   +------> Dummy communication provider
                  |
                  | Status callback / webhook
                  v
             Express backend API
                  |
                  v
             Update communication
```

### Application responsibilities

**Frontend (`client/`)**
- Displays the candidate table and communication dashboard.
- Supports candidate selection, creation, and deletion.
- Opens the send-message panel for selected recipients.
- Opens communication history when a candidate's name is clicked.
- Displays message statuses, loading states, and errors.

**Backend (`server/`)**
- Exposes REST APIs for candidate management and communications.
- Validates requests and persists data using Mongoose.
- Communicates with the dummy provider to submit messages.
- Receives provider callbacks and updates communication statuses.
- Records provider events to prevent duplicate callbacks from being processed repeatedly.

**Dummy provider (`provider/`)**
- Runs as a separate process.
- Accepts message-submission requests from the backend.
- Simulates provider acceptance, failures, and status events.
- Sends status callbacks to the backend using the configured callback endpoint and shared secret.

The frontend does not connect directly to MongoDB or call the provider to submit messages.

## Project Structure

```text
Hunar/
├── client/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── ...
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   ├── .env.example
│   ├── package.json
│   └── ...
├── provider/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

The exact internal files may vary slightly as the implementation evolves.

## Prerequisites

Install the following before running the project:

- Node.js LTS and npm.
- Git.
- A MongoDB database, either MongoDB Atlas or a local MongoDB instance.
- Postman or another HTTP client for API testing.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ritik2513/Hunar.git
cd Hunar
```

### 2. Install frontend dependencies

Open a terminal at the project root:

```bash
cd client
npm install
```

Create a local `.env` file from `.env.example` if the frontend requires environment variables:

```bash
cp .env.example .env
```

On Windows Command Prompt, use:

```cmd
copy .env.example .env
```

Configure the frontend API base URL using the variable name defined in `client/.env.example`.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal.

### 3. Configure and start the backend

Open a second terminal:

```bash
cd Hunar/server
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Configure the MongoDB connection string and other required settings using the names documented in `server/.env.example`.

The backend needs a valid database connection and the correct provider URL and callback secret.

Start the backend:

```bash
npm run dev
```

Verify the health endpoint in a browser or HTTP client. The expected result is a successful HTTP response, such as `200 OK`, with the server's health information.

### 4. Configure and start the dummy provider

Open a third terminal:

```bash
cd Hunar/provider
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Configure the provider port, backend callback URL, and callback secret according to `provider/.env.example`.

Start the provider:

```bash
npm run dev
```

Run all three applications in separate terminals while testing locally.

> **Important:** The commands above assume each application's `package.json` defines a `dev` script and each application has an `.env.example` file. If a script or example file is named differently in the repository, follow that application's actual configuration.

## Environment Configuration

Each application has its own configuration because it runs independently.

| Application | Configuration |
|---|---|
| Frontend | Backend API base URL |
| Backend | Port, MongoDB URI, provider URL, callback secret, and any other required backend settings |
| Provider | Port, backend callback URL, callback secret, and any other required provider settings |

Use the actual variable names in each `.env.example` file as the source of truth.

Never commit real database credentials, API keys, or callback secrets. Keep `.env` files local and commit only placeholder configuration examples.

## Database Setup

The backend uses MongoDB through Mongoose.

1. Create a MongoDB database in Atlas or start a local MongoDB instance.
2. Create a database user with the required database permissions.
3. Configure the connection string in `server/.env`.
4. Ensure the database network access configuration permits connections from the machine running the backend.
5. Start the backend and verify that it connects successfully.

The database stores candidate records, communication records, message attempts, and provider event information as implemented by the backend models.

No separate database connection is required for the frontend. The provider should communicate with the backend over HTTP rather than accessing the database directly.

## API Overview

The backend exposes REST APIs under its configured API prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health, if enabled at this path |
| POST | `/api/candidates` | Create a candidate |
| GET | `/api/candidates` | List and search candidates |
| GET | `/api/candidates/:id` | Retrieve a candidate, if implemented |
| DELETE | `/api/candidates/:id` | Delete a candidate |
| POST | `/api/communications/send` | Send an individual message |
| POST | `/api/communications/bulk` | Send messages to multiple candidates |
| GET | `/api/communications/candidate/:candidateId` | Retrieve a candidate's communication history |
| POST | `/api/communications/provider-callback` | Receive provider status events |

The provider exposes its own message-submission endpoint, including `/api/provider/send` in the current backend integration.

Confirm the exact routes, callback path, request fields, and response envelopes in the route and validation files before using this table as a formal API contract. The running application and its implementation are authoritative.

## Messaging and Status Behavior

### Individual and bulk messaging

Each recipient has an independently tracked communication record. Bulk sending processes recipients independently and records individual outcomes.

A failure for one recipient should not prevent other recipients from being processed.

### Message statuses

- **Sending:** The backend is attempting to submit the message.
- **Sent:** The provider has accepted the message for processing.
- **Delivered:** The provider reports successful delivery.
- **Read:** The provider reports a read event, if supported by the simulation.
- **Failed:** Submission or delivery has failed.

Provider acceptance does not guarantee delivery.

### Provider events and idempotency

The backend associates provider events with their corresponding communication and message attempt. Duplicate event IDs should not be processed repeatedly.

Status handling should prevent delayed events from incorrectly downgrading a later valid state or overwriting the result of a newer retry.

### Retry behavior

Eligible failed messages may be retried. Permanent failures, such as invalid recipient details, should not be retried without correcting the underlying problem. Temporary failures may be retried according to the implemented retry rules.

Previous attempts should remain available for debugging and history.

## Testing

### Manual acceptance testing

Use the frontend and Postman to verify:

- [ ] Create a candidate and verify that it appears in the list.
- [ ] Search for a candidate.
- [ ] Open a candidate's communication history.
- [ ] Verify the empty state for a candidate without previous messages.
- [ ] Send an individual message and verify its communication record.
- [ ] Send a bulk message to multiple candidates.
- [ ] Simulate a provider failure and verify that other recipients still receive independent outcomes.
- [ ] Trigger provider status callbacks and verify that the stored status changes.
- [ ] Submit a duplicate provider event and verify that it is not processed twice.
- [ ] Retry an eligible failed message.
- [ ] Delete a candidate and verify the UI reflects the result.

### Automated tests

Install dependencies in the relevant application and run its available test script:

```bash
npm test
```

Run this command from the relevant application directory only if that application's `package.json` defines a test script. Check each `package.json` for the actual test command and document the test coverage that is genuinely present.

## Assumptions and Limitations

- The communication provider is a simulator, not a production messaging gateway.
- Provider delivery and read events are simulated; they do not prove that a real recipient received or read a message.
- MongoDB is configured externally and is not bundled with the application.
- All three applications must be running locally for the complete workflow to operate.
- The provider callback URL must be reachable from the provider process.
- Local development uses localhost URLs and configured ports; those values must agree across the applications.
- No public deployment is provided as part of this submission.
- Authentication, authorization, production monitoring, and advanced retry infrastructure are outside the scope of the current implementation unless explicitly implemented in the code.

## Future Improvements

- Automated integration tests for bulk messaging and provider callback handling.
- Improved provider health and delivery metrics.
- More efficient communication-history queries for larger candidate lists.
- Authentication and role-based access controls if required.
- Production messaging-provider integration and deployment.

## Repository

GitHub: https://github.com/Ritik2513/Hunar

## License

Created as a coding assignment for evaluation by Hunar AI.
