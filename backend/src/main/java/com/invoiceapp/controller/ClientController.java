package com.invoiceapp.controller;

import com.invoiceapp.dto.client.ClientDto;
import com.invoiceapp.entity.User;
import com.invoiceapp.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<Page<ClientDto>> getClients(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction dir = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(dir, sort));
        return ResponseEntity.ok(clientService.getClients(user, search, pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ClientDto>> getAllClients(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientService.getAllClients(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDto> getClientById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientService.getClientById(id, user));
    }

    @PostMapping
    public ResponseEntity<ClientDto> createClient(
            @Valid @RequestBody ClientDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(clientService.createClient(dto, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDto> updateClient(
            @PathVariable Long id,
            @Valid @RequestBody ClientDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(clientService.updateClient(id, dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id, @AuthenticationPrincipal User user) {
        clientService.deleteClient(id, user);
        return ResponseEntity.noContent().build();
    }
}
