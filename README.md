# Maintenance Ticket Platform

A microservices-based maintenance ticket management platform built with React and Spring Boot. The application manages user identities, maintenance tickets, and ticket assignments through independent backend services.

## Features

- User registration and authentication
- JWT-based authentication and authorization
- Maintenance ticket management
- Ticket assignment management
- Role-based access control
- PostgreSQL database persistence
- Event-driven communication using Apache Kafka
- React-based frontend
- Docker Compose support
- Application metrics and monitoring using Prometheus and Grafana
- Automated CI pipeline using GitHub Actions

## Tech Stack

- React
- TypeScript
- Vite
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Spring Boot Actuator
- Micrometer
- Maven
- PostgreSQL
- Apache Kafka
- Prometheus
- Grafana
- Docker / Docker Compose
- Nginx
- GitHub Actions

---

## Running the Project

There are two ways to run the application.

### 1. Run Locally

Use this option if you already have the required development tools installed.

**Requirements**

- JDK 21
- Apache Maven
- Node.js 22 and npm
- PostgreSQL
- Apache Kafka

**Start the Backend**

Make sure PostgreSQL and Kafka are running and the required databases are configured.

Start each backend service in a separate terminal.

**Identity Service**

cd identity-service
mvn spring-boot:run

**Ticket Service**

cd ticket-service
mvn spring-boot:run

**Assignment Service**

cd assignment-service
mvn spring-boot:run

**Start the Frontend**

Open another terminal:

cd frontend/maintenance-ticket-frontend
npm install
npm run dev

The frontend runs at: [http://localhost:5173](http://localhost:5173)

**Backend Services**

- Identity Service: [http://localhost:8080](http://localhost:8080)
- Ticket Service: [http://localhost:8081](http://localhost:8081)
- Assignment Service: [http://localhost:8082](http://localhost:8082)

Make sure database credentials, connection URLs, Kafka address, and JWT secret are configured correctly before starting the backend services.

---

### 2. Run with Docker Compose

Use this option if you do not want to install Java, Maven, Node.js, PostgreSQL, or Kafka locally.

**Requirements**

- Docker Desktop
- Git

**Start the Application**

From the project root:

docker compose up --build -d

Docker Compose builds the application images locally from the included Dockerfiles and starts the configured services:

- React frontend
- Identity Service
- Ticket Service
- Assignment Service
- PostgreSQL databases
- Apache Kafka
- Prometheus
- Grafana

No local PostgreSQL or Kafka installation is required.

**Open the Application**

- Frontend: [http://localhost](http://localhost)
- Identity Service: [http://localhost:8080](http://localhost:8080)
- Ticket Service: [http://localhost:8081](http://localhost:8081)
- Assignment Service: [http://localhost:8082](http://localhost:8082)
- Grafana: [http://localhost:3000](http://localhost:3000)

**View Logs**

docker compose logs -f

**Check Running Containers**

docker compose ps

**Stop the Application**

docker compose down

Named database and monitoring volumes are preserved when stopping the application. Do not use docker compose down -v unless you intend to delete the persisted volumes and their data.

---

## Monitoring and Observability

The project includes Prometheus and Grafana to monitor the three Spring Boot backend services.

### Prometheus

Prometheus collects application metrics from:

- Identity Service
- Ticket Service
- Assignment Service

The services expose monitoring endpoints through Spring Boot Actuator and Micrometer.

The Prometheus scrape configuration is located at:

monitoring/prometheus/prometheus.yml

Metrics are collected every 15 seconds.

### Grafana

Grafana provides dashboards for visualizing the metrics collected by Prometheus.

Open Grafana:

[http://localhost:3000](http://localhost:3000)

On a fresh Grafana installation, the default initial credentials are:

- Username: admin
- Password: admin

Change the default password during the initial login.

### Monitoring Configuration

Each backend service uses a separate management port:

| Service | Application Port | Management Port |
|---|---:|---:|
| Identity Service | 8080 | 9080 |
| Ticket Service | 8081 | 9080 |
| Assignment Service | 8082 | 9080 |

The management endpoints exposed for monitoring are:

- /actuator/health
- /actuator/prometheus

The management port is not published to the host. Prometheus accesses the endpoints through the internal Docker Compose network.

Prometheus itself is also kept internal to the Docker network. Grafana connects to it using:

http://prometheus:9090

This setup keeps the monitoring services separate from the application-facing ports.

---

## CI Pipeline

The project uses GitHub Actions to automatically validate code changes.

The pipeline runs on every push and pull request.

It performs:

- Backend compilation, tests, and verification for all three services.
- Frontend dependency installation using  npm ci.
- Frontend lint checks.
- TypeScript type checking.
- Prettier formatting checks.
- Frontend production build.
- Final pipeline status validation.

Workflow file:

.github/workflows/ci-cd.yml

The pipeline focuses on continuous integration. Docker image publishing and application deployment are not currently included.

---

## Project Structure

```text
maintenance-ticket-platform/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── identity-service/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── ticket-service/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── assignment-service/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   └── maintenance-ticket-frontend/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
│
├── monitoring/
│   └── prometheus/
│       └── prometheus.yml
│
├── docker-compose.yml
└── README.md
```

---

## Testing

**Run Backend Tests**

Run inside each backend service directory:

mvn test

To run tests and verify the complete Maven build:

mvn clean verify

**Check and Build Frontend**

cd frontend/maintenance-ticket-frontend
npm ci
npm run lint
npm run typecheck
npx prettier --check .
npm run build

---

## Docker Images

Docker images are currently built locally through Docker Compose.

Published images and pull instructions will be added here once available.

---

**Project Status:** Under Development