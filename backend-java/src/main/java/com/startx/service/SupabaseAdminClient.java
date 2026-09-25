package com.startx.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for Supabase Admin Auth API (service-role operations).
 *
 * <p>Uses the service-role key which bypasses Supabase RLS.
 * NEVER log the service-role key value.</p>
 */
@Service
@SuppressWarnings("null")
public class SupabaseAdminClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseAdminClient.class);

    private final RestTemplate restTemplate;

    @Value("${app.supabase.url}")
    private String supabaseUrl;

    @Value("${app.supabase.service-role-key}")
    private String serviceRoleKey;

    public SupabaseAdminClient() {
        this.restTemplate = new RestTemplate();
    }

    // -------------------------------------------------------------------------
    // Invite user via Supabase Admin Auth API
    // -------------------------------------------------------------------------

    /**
     * Invite a user by email. Supabase sends them an email invitation.
     * Returns the Supabase Auth user UUID.
     *
     * @param email  target email (normalized)
     * @param role   DB-level role: student | staff | admin
     * @return Supabase auth.users UUID as String
     */
    @SuppressWarnings("rawtypes")
    public String inviteUser(String email, String role) {
        String url = supabaseUrl + "/auth/v1/invite";

        HttpHeaders headers = buildAdminHeaders();
        Map<String, Object> body = Map.of(
                "email", email,
                "data", Map.of("role", role)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map bodyMap = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && bodyMap != null) {
                Object id = bodyMap.get("id");
                if (id == null) throw new RuntimeException("Supabase invite response missing 'id'");
                return id.toString();
            }
        } catch (HttpClientErrorException e) {
            String body2 = e.getResponseBodyAsString();
            log.error("Supabase invite failed for {}: {}", email, body2);
            throw new RuntimeException("Failed to invite user: " + body2);
        } catch (Exception e) {
            log.error("Supabase invite error for {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to invite user");
        }
        throw new RuntimeException("Failed to invite user — no ID returned");
    }

    // -------------------------------------------------------------------------
    // Update app_metadata.role on an existing Supabase Auth user
    // -------------------------------------------------------------------------

    /**
     * Sets app_metadata.role on the Supabase Auth user so that future JWTs
     * carry the role claim and the SupabaseJwtAuthConverter maps it correctly.
     *
     * <p>Uses the Admin Auth API PATCH /auth/v1/admin/users/{uid}.</p>
     *
     * @param supabaseUserId  Supabase auth.users UUID
     * @param dbRole          DB-level role string: student | staff | admin
     */
    public void updateAppMetadataRole(String supabaseUserId, String dbRole) {
        String url = supabaseUrl + "/auth/v1/admin/users/" + supabaseUserId;

        HttpHeaders headers = buildAdminHeaders();
        Map<String, Object> body = Map.of(
                "app_metadata", Map.of("role", dbRole)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
            log.info("Updated app_metadata.role={} for Supabase user {}", dbRole, supabaseUserId);
        } catch (HttpClientErrorException e) {
            log.error("Failed to update app_metadata for {}: {}", supabaseUserId,
                    e.getResponseBodyAsString());
            throw new RuntimeException("Supabase metadata update failed: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error updating app_metadata for {}: {}", supabaseUserId, e.getMessage());
            throw new RuntimeException("Supabase metadata update error: " + e.getMessage());
        }
    }

    /**
     * Create a user with a default password.
     */
    @SuppressWarnings("rawtypes")
    public String createUser(String email, String role) {
        String url = supabaseUrl + "/auth/v1/admin/users";

        HttpHeaders headers = buildAdminHeaders();
        Map<String, Object> body = Map.of(
                "email", email,
                "password", "Welcome@123",
                "email_confirm", true,
                "app_metadata", Map.of("role", role)
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map bodyMap = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && bodyMap != null) {
                Object id = bodyMap.get("id");
                if (id == null) throw new RuntimeException("Supabase create user response missing 'id'");
                return id.toString();
            }
        } catch (HttpClientErrorException e) {
            String body2 = e.getResponseBodyAsString();
            log.error("Supabase create user failed for {}: {}", email, body2);
            // If it's already registered, we might want to just fetch or ignore.
            // For now, throw and let the caller handle it.
            throw new RuntimeException("Failed to create user: " + body2);
        } catch (Exception e) {
            log.error("Supabase create user error for {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to create user");
        }
        throw new RuntimeException("Failed to create user — no ID returned");
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public String getUserIdByEmail(String email) {
        String url = supabaseUrl + "/auth/v1/admin/users";
        HttpHeaders headers = buildAdminHeaders();
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            // Wait, this returns an array of users? No, GoTrue GET /admin/users returns a pagination object like:
            // { "users": [...] }
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map bodyMap = response.getBody();
            if (bodyMap != null && bodyMap.containsKey("users")) {
                java.util.List<Map<String, Object>> users = (java.util.List<Map<String, Object>>) bodyMap.get("users");
                for (Map<String, Object> user : users) {
                    if (email.equalsIgnoreCase((String) user.get("email"))) {
                        return user.get("id").toString();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to list users to find email {}", email, e);
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private HttpHeaders buildAdminHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", serviceRoleKey);
        headers.setBearerAuth(serviceRoleKey);
        return headers;
    }
}
