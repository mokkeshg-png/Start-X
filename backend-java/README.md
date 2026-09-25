# Start-X Java Backend

This is the main business API backend for the Start-X project, built with Java 21 and Spring Boot 3.x.

## Technologies
- Java 21
- Spring Boot 3.3.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- Maven

## Setup
Configure the environment variables in `application.yml` or by creating an `.env` file (if using a dotenv loader, or just exporting them to your environment). See `.env.example` for required values.

## Run
```bash
mvn spring-boot:run
```

## Testing
```bash
mvn test
```
