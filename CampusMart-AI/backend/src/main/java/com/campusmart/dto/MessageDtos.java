package com.campusmart.dto; import jakarta.validation.constraints.*;
public class MessageDtos { public record Send(@NotNull Long receiverId,@NotBlank @Size(max=2000) String content){} }
