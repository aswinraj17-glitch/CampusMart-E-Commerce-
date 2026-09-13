package com.campusmart.controller;
import com.campusmart.entity.Category; import com.campusmart.repository.CategoryRepository; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/categories") public class CategoryController {private final CategoryRepository r;public CategoryController(CategoryRepository r){this.r=r;}@GetMapping public List<Category> all(){return r.findAll();}}
