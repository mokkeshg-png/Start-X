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
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object id = response.getBody().get("id");
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
            restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
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
