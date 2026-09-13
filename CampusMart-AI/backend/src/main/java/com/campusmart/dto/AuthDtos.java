package com.campusmart.dto;
import jakarta.validation.constraints.*;
public class AuthDtos {public record Register(@NotBlank String fullName,@Email @NotBlank String email,@Size(min=8,max=72) String password,@NotBlank String confirmPassword,@NotBlank String collegeName,@NotBlank String studentId){} public record Login(@Email @NotBlank String email,@NotBlank String password){} public record Verify(@Email @NotBlank String email,@NotBlank String code){} public record AuthResponse(String token,Long id,String name,String email,String role){}}
