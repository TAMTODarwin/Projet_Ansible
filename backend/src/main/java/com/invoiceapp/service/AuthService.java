package com.invoiceapp.service;

import com.invoiceapp.dto.auth.*;
import com.invoiceapp.entity.User;
import com.invoiceapp.entity.enums.Role;
import com.invoiceapp.repository.UserRepository;
import com.invoiceapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .company(request.getCompany())
                  .companyType(request.getCompanyType())
                  .phone(request.getPhone())
                  .siret(request.getSiret())
                  .rcs(request.getRcs())
                  .address(request.getAddress())
                  .zipCode(request.getZipCode())
                  .city(request.getCity())
                  .paymentMethod(request.getPaymentMethod())
                  .role(com.invoiceapp.entity.enums.Role.ROLE_USER)
                  .build();

          userRepository.save(user);
          String jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToUserDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToUserDto(user))
                .build();
    }

    public UserDto getCurrentUser(User user) {
        return mapToUserDto(user);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .company(user.getCompany())
                .companyType(user.getCompanyType())
                .phone(user.getPhone())
                .siret(user.getSiret())
                .rcs(user.getRcs())
                .address(user.getAddress())
                .zipCode(user.getZipCode())
                .city(user.getCity())
                .paymentMethod(user.getPaymentMethod())
                .role(user.getRole().name())
                .build();
    }
}
