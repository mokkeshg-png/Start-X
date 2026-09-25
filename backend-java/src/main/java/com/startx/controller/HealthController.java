package com.startx.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "Start-X Java Backend"
        ));
    }

    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, String>> healthV1() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "Start-X Java Backend",
                "version", "v1"
        ));
    }
}
