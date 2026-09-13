package com.campusmart.dto;
import com.campusmart.entity.Product; import jakarta.validation.constraints.*; import java.math.BigDecimal;
public class ProductDtos { public record Create(@NotBlank String name,@NotBlank String description,@NotNull Long categoryId,@NotNull @DecimalMin("0.0") BigDecimal price,@NotNull Product.Condition condition,@NotNull Product.ProductType productType,String imageUrl,@NotBlank String location){} }
