
# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_IDENTITY_API_URL=http://localhost:8080
ARG VITE_TICKET_API_URL=http://localhost:8081
ARG VITE_ASSIGNMENT_API_URL=http://localhost:8082

ENV VITE_IDENTITY_API_URL=$VITE_IDENTITY_API_URL
ENV VITE_TICKET_API_URL=$VITE_TICKET_API_URL
ENV VITE_ASSIGNMENT_API_URL=$VITE_ASSIGNMENT_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
