package com.example.ecm.controller;

import com.example.ecm.DTO.Request.ProfileRequestDto;
import com.example.ecm.DTO.Response.ProfileResponseDto;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping
    public ResponseEntity<ProfileResponseDto> create(@Valid @RequestBody ProfileRequestDto dto,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (!isAdmin(userDetails) && !dto.getUserId().equals(userDetails.getId())) {
            throw new AccessDeniedException("Solo puedes crear tu propio perfil");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(dto));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDto> findMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(profileService.findById(userDetails.getId()));
    }



    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponseDto> findById(@PathVariable Long id,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProfileResponseDto profile = profileService.findById(id);
        if (!isAdmin(userDetails) && !isOwner(profile, userDetails)) {
            throw new AccessDeniedException("No tienes permiso para ver este perfil");
        }
        return ResponseEntity.ok(profile);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProfileResponseDto>> findAll() {
        return ResponseEntity.ok(profileService.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfileResponseDto> update(@PathVariable Long id,
                                                     @Valid @RequestBody ProfileRequestDto dto,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProfileResponseDto existing = profileService.findById(id);
        if (!isAdmin(userDetails) && !isOwner(existing, userDetails)) {
            throw new AccessDeniedException("No tienes permiso para editar este perfil");
        }
        return ResponseEntity.ok(profileService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        profileService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isOwner(ProfileResponseDto profile, CustomUserDetails userDetails) {
        return profile.getUser().getId().equals(userDetails.getId());
    }
}