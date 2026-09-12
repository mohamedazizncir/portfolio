---
type: project
id: spring-ai-backend
tags: [java, spring-boot, backend, ai]
---

## Subject 4: Intelligent Application with Spring AI & LLM

Internship/academic backend project. Spring Boot 3.x on Java 21, with REST APIs, conversational memory, and AI-assisted content generation.

**Architecture decisions:** UUID primary keys, TEXT over VARCHAR for message content, Flyway over Hibernate auto-DDL for schema management, Ollama instead of a paid API as the LLM provider. PostgreSQL for development, H2 for testing (switched to H2 after a Testcontainers/Docker compatibility issue). Uses Conventional Commits for git history.

