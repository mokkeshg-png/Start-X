package com.startx.controller;

import com.startx.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, String>>> info() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "Start-X Java Backend",
                "version", "1.0.0",
                "environment", "development"
        )));
    }
}
