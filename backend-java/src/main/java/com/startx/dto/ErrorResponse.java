package com.startx.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standard error response envelope for all API errors.
 * success is always false for error responses.
 *
 * Note: explicit getters used instead of Lombok @Data due to JDK 26
 * annotation processing incompatibility with Lombok < 1.18.48 bytecode.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String message;
    private String error;
    private Object details;

    public ErrorResponse() {
        this.success = false;
    }

    public ErrorResponse(String message, String error) {
        this.success = false;
        this.message = message;
        this.error   = error;
    }

    public ErrorResponse(String message, String error, Object details) {
        this.success = false;
        this.message = message;
        this.error   = error;
        this.details = details;
    }

    // Full constructor
    public ErrorResponse(boolean success, String message, String error, Object details) {
        this.success = success;
        this.message = message;
        this.error   = error;
        this.details = details;
    }

    // Getters — required by Jackson for serialization
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public String getError()   { return error; }
    public Object getDetails() { return details; }

    // Setters — required by Jackson for deserialization
    public void setSuccess(boolean success) { this.success = success; }
    public void setMessage(String message)  { this.message = message; }
    public void setError(String error)      { this.error = error; }
    public void setDetails(Object details)  { this.details = details; }
}
