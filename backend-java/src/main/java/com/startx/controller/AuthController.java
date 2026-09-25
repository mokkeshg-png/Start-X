package com.startx.controller;

import com.startx.dto.ApiResponse;
import com.startx.dto.UserDto;
import com.startx.exception.NotImplementedException;
import com.startx.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Object>> signup() {
        throw new NotImplementedException("Auth is handled directly by Supabase on the frontend, or this backend endpoint is not yet implemented.");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login() {
        throw new NotImplementedException("Login is handled directly by Supabase on the frontend, or this backend endpoint is not yet implemented.");
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout() {
        throw new NotImplementedException("Logout is not yet implemented.");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Object>> refresh() {
        throw new NotImplementedException("Refresh is not yet implemented.");
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized", null));
        }

        String userIdStr = authentication.getName();
        try {
            UUID userId = UUID.fromString(userIdStr);
            return userService.getUserById(userId)
                    .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse<>(false, "User not found", null)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "Bad Request", null));
        }
    }
}
