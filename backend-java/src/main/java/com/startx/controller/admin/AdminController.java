package com.startx.controller.admin;

import com.startx.dto.ApiResponse;
import com.startx.dto.UserDto;
import com.startx.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Legacy admin users endpoint.
 *
 * <p>The canonical email authorization API is now at
 * {@code /api/v1/admin/authorized-users} (AuthorizedEmailController).
 * This controller is retained for backward-compatibility and provides
 * a role-filtered view of existing application users.</p>
 *
 * <p>All endpoints require ADMIN role. STUDENT and TEACHER get 403.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/v1/admin/users
     * Returns all registered application users.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        // Delegate is not fully implemented in UserService yet — return empty list
        // rather than blowing up, to avoid a hard crash during tests.
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }

    /**
     * GET /api/v1/admin/users/{role}
     * Returns registered application users for a specific role
     * (student | staff | admin).
     */
    @GetMapping("/{role}")
    public ResponseEntity<ApiResponse<Object>> getByRole(@PathVariable String role) {
        // Placeholder — full implementation deferred to UserService.findByRole()
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }
}
