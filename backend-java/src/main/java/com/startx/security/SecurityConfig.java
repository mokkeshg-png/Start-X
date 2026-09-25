package com.startx.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security configuration for the Start-X Java backend.
 *
 * Authentication: Supabase ES256 JWT verified via JWKS endpoint.
 *   JWKS: https://rrosugsevmwzcailipyd.supabase.co/auth/v1/.well-known/jwks.json
 *   Issuer validated against the 'iss' claim in application.yml.
 *
 * The old jjwt-based JwtAuthenticationFilter has been replaced by Spring Security's
 * built-in OAuth2 Resource Server support, which handles:
 *   - Remote JWKS fetch and in-memory key caching
 *   - ES256 signature verification
 *   - Expiry (exp) and not-before (nbf) claim checking
 *   - Issuer (iss) claim validation
 *   - Key rotation via kid matching
 *
 * Role extraction from app_metadata.role is handled by SupabaseJwtAuthConverter.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final SupabaseJwtAuthConverter supabaseJwtAuthConverter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    // Explicit constructor — Lombok @RequiredArgsConstructor unreliable on JDK 26
    public SecurityConfig(
            SupabaseJwtAuthConverter supabaseJwtAuthConverter,
            CustomAuthenticationEntryPoint authenticationEntryPoint,
            CustomAccessDeniedHandler accessDeniedHandler,
            CorsConfigurationSource corsConfigurationSource) {
        this.supabaseJwtAuthConverter = supabaseJwtAuthConverter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler      = accessDeniedHandler;
        this.corsConfigurationSource  = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .exceptionHandling(exception -> exception
                // 403 for authenticated users hitting forbidden resources
                .accessDeniedHandler(accessDeniedHandler)
                // 401 fallback for non-OAuth2 paths (should rarely fire given resource server below)
                .authenticationEntryPoint(authenticationEntryPoint)
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // Public health & system endpoints — no token required
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/v1/health").permitAll()
                .requestMatchers("/api/v1/database/health").permitAll()
                .requestMatchers("/api/v1/system/info").permitAll()
                // Auth stubs — token not yet issued at these points
                .requestMatchers("/api/v1/auth/signup").permitAll()
                .requestMatchers("/api/v1/auth/login").permitAll()
                .requestMatchers("/api/v1/auth/refresh").permitAll()
                // Bootstrap requires a valid JWT (checked in controller) but not a DB role
                .requestMatchers("/api/v1/admin/bootstrap").authenticated()
                // Everything else requires a valid Supabase JWT
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    // Uses jwk-set-uri and issuer-uri from application.yml automatically.
                    // SupabaseJwtAuthConverter maps claims → Spring Security authorities.
                    .jwtAuthenticationConverter(supabaseJwtAuthConverter)
                )
                // Both missing-token (401) and invalid-token (401) use our custom JSON response
                .authenticationEntryPoint(authenticationEntryPoint)
            );

        return http.build();
    }
}
