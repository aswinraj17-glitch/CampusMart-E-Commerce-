package com.campusmart.entity;
import jakarta.persistence.*;
@Entity @Table(name="wishlist",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","product_id"}))public class WishlistItem{@Id @GeneratedValue(strategy=GenerationType.IDENTITY)private Long id;@ManyToOne(optional=false)private User user;@ManyToOne(optional=false)private Product product;public Long getId(){return id;}public User getUser(){return user;}public void setUser(User v){user=v;}public Product getProduct(){return product;}public void setProduct(Product v){product=v;}}
