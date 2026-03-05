package com.invoiceapp.service;

import com.invoiceapp.dto.client.ClientDto;
import com.invoiceapp.entity.Client;
import com.invoiceapp.entity.User;
import com.invoiceapp.repository.ClientRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    public Page<ClientDto> getClients(User user, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return clientRepository.searchClients(user, search, pageable).map(this::mapToDto);
        }
        return clientRepository.findByUserAndActiveTrue(user, pageable).map(this::mapToDto);
    }

    public List<ClientDto> getAllClients(User user) {
        return clientRepository.findByUserAndActiveTrue(user)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ClientDto getClientById(Long id, User user) {
        return clientRepository.findByIdAndUser(id, user)
                .map(this::mapToDto)
                .orElseThrow(() -> new EntityNotFoundException("Client non trouvé avec l'id: " + id));
    }

    public ClientDto createClient(ClientDto dto, User user) {
        if (clientRepository.existsByEmailAndUser(dto.getEmail(), user)) {
            throw new RuntimeException("Un client avec cet email existe déjà");
        }
        Client client = mapToEntity(dto);
        client.setUser(user);
        return mapToDto(clientRepository.save(client));
    }

    public ClientDto updateClient(Long id, ClientDto dto, User user) {
        Client client = clientRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Client non trouvé avec l'id: " + id));

        client.setName(dto.getName());
        client.setEmail(dto.getEmail());
        client.setPhone(dto.getPhone());
        client.setCompany(dto.getCompany());
        client.setAddress(dto.getAddress());
        client.setPostalCode(dto.getPostalCode());
        client.setCity(dto.getCity());
        client.setCountry(dto.getCountry());
        client.setSiret(dto.getSiret());
        client.setTvaNumber(dto.getTvaNumber());
        client.setNotes(dto.getNotes());

        return mapToDto(clientRepository.save(client));
    }

    public void deleteClient(Long id, User user) {
        Client client = clientRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Client non trouvé avec l'id: " + id));
        client.setActive(false);
        clientRepository.save(client);
    }

    private ClientDto mapToDto(Client client) {
        return ClientDto.builder()
                .id(client.getId())
                .name(client.getName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .company(client.getCompany())
                .address(client.getAddress())
                .postalCode(client.getPostalCode())
                .city(client.getCity())
                .country(client.getCountry())
                .siret(client.getSiret())
                .tvaNumber(client.getTvaNumber())
                .notes(client.getNotes())
                .active(client.isActive())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .invoiceCount(client.getInvoices() != null ? client.getInvoices().size() : 0)
                .build();
    }

    private Client mapToEntity(ClientDto dto) {
        return Client.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .company(dto.getCompany())
                .address(dto.getAddress())
                .postalCode(dto.getPostalCode())
                .city(dto.getCity())
                .country(dto.getCountry())
                .siret(dto.getSiret())
                .tvaNumber(dto.getTvaNumber())
                .notes(dto.getNotes())
                .build();
    }
}
