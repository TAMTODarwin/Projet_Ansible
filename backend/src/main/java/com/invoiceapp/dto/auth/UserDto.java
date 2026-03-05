package com.invoiceapp.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String company;
    private String companyType;
    private String phone;
    private String siret;
    private String rcs;
    private String address;
    private String zipCode;
    private String city;
    private String paymentMethod;
    private String role;
}
