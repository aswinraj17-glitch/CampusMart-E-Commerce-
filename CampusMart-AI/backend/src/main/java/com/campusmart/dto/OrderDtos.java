package com.campusmart.dto; import jakarta.validation.constraints.*;
public class OrderDtos { public record Item(@NotNull Long productId,@Min(1) int quantity){} public record Create(@NotEmpty java.util.List<Item> items){} public record StatusUpdate(@NotNull com.campusmart.entity.Order.Status status){} }
