# Hello CI/CD Demo

This is a minimal production-style application designed specifically for learning and testing a CI/CD pipeline. The application itself is intentionally simple to keep the focus entirely on the deployment process.

## Project Purpose

The primary goal of this repository is to serve as the application code for a CI/CD pipeline using Jenkins, Docker, and Harbor. It provides a simple Express server that returns JSON data, including dynamic fields like timestamp and hostname, which is useful for verifying container deployments.

## Repository Structure

```text
.
├── Dockerfile          # Production-ready Dockerfile with layer caching
├── Jenkinsfile         # Declarative Jenkins pipeline (Checkout, Install, Build)
├── README.md           # Project documentation
├── .dockerignore       # Excludes unnecessary files from the Docker context
├── .gitignore          # Excludes files from Git version control
├── package.json        # Node.js dependencies and scripts
├── package-lock.json   # Exact dependency tree
└── server.js           # Minimal Express application
```

## Running Locally

To run this application locally without Docker, you need Node.js 22 installed.

### Installing Dependencies

```bash
npm install
```

### Running the Application

```bash
npm start
```

You can also run it using the dev script:

```bash
npm run dev
```

The server will start on port 3000 by default. You can override the port by setting the `PORT` environment variable.

## Running with Docker

### Building the Image

To build the Docker image locally, run the following command in the root directory:

```bash
docker build -t hello-cicd:latest .
```

### Running the Image

Run the built image and map port 3000 on your host to port 3000 in the container:

```bash
docker run -p 3000:3000 -d --name hello-cicd-container hello-cicd:latest
```

## Testing Endpoints

Once the application is running (either locally or via Docker), you can test the available endpoints.

### Root Endpoint

Returns general application information.

```bash
curl http://localhost:3000/
```

Example Response:
```json
{
  "application": "hello-cicd",
  "version": "1.0.0",
  "message": "Hello from CI/CD Demo",
  "timestamp": "2026-07-07T00:00:00.000Z",
  "hostname": "container-id"
}
```

### Health Check

Returns the health status of the application.

```bash
curl http://localhost:3000/health
```

Example Response:
```json
{
  "status": "UP"
}
```

## Future CI/CD Pipeline

This repository includes a `Jenkinsfile` that defines the initial stages of a CI/CD pipeline:
1. **Checkout**: Clones the repository.
2. **Install Dependencies**: Runs `npm install`.
3. **Build Docker Image**: Builds the Docker image and tags it with the Jenkins build number (or `latest`).

Future stages to be added to the pipeline:
- Docker Login (to Harbor registry)
- Push image to Harbor
- Deploy application (e.g., to a Docker server or Kubernetes cluster)
