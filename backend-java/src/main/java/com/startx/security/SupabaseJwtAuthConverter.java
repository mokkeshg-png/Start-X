package com.startx.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Converts a validated Supabase ES256 JWT into a Spring Security Authentication.
 *
 * Supabase JWT claim structure:
 *   sub          → Supabase user UUID (used as principal name)
 *   role         → Supabase database role ("authenticated", "anon")
 *   app_metadata → {"provider":..., "role":"staff"|"student"|"admin"|...}
 *   user_metadata→ display name, avatar, etc.
 *
 * This converter extracts the application-level role from app_metadata.role
 * and maps it to a Spring Security ROLE_* authority.
 * If app_metadata.role is absent, it defaults to ROLE_USER.
 */
@Component
public class SupabaseJwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Logger log = LoggerFactory.getLogger(SupabaseJwtAuthConverter.class);

    @Override
    public AbstractAuthenticationToken convert(@org.springframework.lang.NonNull Jwt jwt) {
        String userId = jwt.getSubject();   // Supabase user UUID
        String role   = extractRole(jwt);   // Application-level role

        Collection<SimpleGrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority(role));

        log.debug("Authenticated Supabase user: sub={}, role={}", userId, role);

        return new JwtAuthenticationToken(jwt, authorities, userId);
    }

    /**
     * Extract the application role from app_metadata.role.
     * Falls back to ROLE_USER when the claim is absent or not a recognised value.
     *
     * Supabase stores custom roles in:
     *   app_metadata: { "role": "staff" | "student" | "department_head" | "admin" }
     */
    private String extractRole(Jwt jwt) {
        try {
            Map<String, Object> appMeta = jwt.getClaimAsMap("app_metadata");
            if (appMeta != null && appMeta.containsKey("role")) {
                String rawRole = String.valueOf(appMeta.get("role")).toLowerCase().trim();
                return switch (rawRole) {
                    case "admin"           -> "ROLE_ADMIN";
                    case "staff"           -> "ROLE_STAFF";
                    case "department_head" -> "ROLE_DEPARTMENT_HEAD";
                    case "student"         -> "ROLE_STUDENT";
                    default                -> "ROLE_USER";
                };
            }
        } catch (Exception ex) {
            log.warn("Could not extract role from app_metadata, defaulting to ROLE_USER: {}", ex.getMessage());
        }
        return "ROLE_USER";
    }
}
