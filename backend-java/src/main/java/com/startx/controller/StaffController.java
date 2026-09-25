package com.startx.controller;

import com.startx.dto.ApiResponse;
import com.startx.exception.NotImplementedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAll() {
        throw new NotImplementedException("Staff module is not yet implemented");
    }
}
