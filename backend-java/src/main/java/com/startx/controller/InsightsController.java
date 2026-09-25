package com.startx.controller;

import com.startx.dto.ApiResponse;
import com.startx.exception.NotImplementedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightsController {
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAll() {
        throw new NotImplementedException("Insights module is not yet implemented");
    }
}
