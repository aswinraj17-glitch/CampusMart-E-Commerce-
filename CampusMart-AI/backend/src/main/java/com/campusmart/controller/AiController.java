package com.campusmart.controller;
import com.campusmart.service.AiService;import jakarta.validation.constraints.*;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/ai") public class AiController{private final AiService s;public AiController(AiService s){this.s=s;}record Request(@NotBlank String requirement){}@PostMapping("/recommend")public Map<String,Object>recommend(@RequestBody Request r){return s.recommend(r.requirement());}}
