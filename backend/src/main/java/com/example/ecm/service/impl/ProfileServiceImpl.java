package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.ProfileRequestDto;
import com.example.ecm.DTO.Response.ProfileResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.ProfileMapper;
import com.example.ecm.model.Profile;
import com.example.ecm.repository.ProfileRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;

    @Override
    @Transactional
    public ProfileResponseDto create(ProfileRequestDto dto) {
        // Verifica que el user exista antes de crear el perfil (relación OneToOne obligatoria)
        if (!userRepository.existsById(dto.getUserId())) {
            throw new ResourceNotFoundException("User no encontrado con id: " + dto.getUserId());
        }
        Profile profile = profileMapper.toEntity(dto);
        Profile saved = profileRepository.save(profile);
        return profileMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDto findById(Long id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile no encontrado con id: " + id));
        return profileMapper.toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfileResponseDto> findAll() {
        return profileMapper.toResponseList(profileRepository.findAll());
    }

    @Override
    @Transactional
    public ProfileResponseDto update(Long id, ProfileRequestDto dto) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile no encontrado con id: " + id));

        profile.setFullName(dto.getFullName());
        profile.setPhone(dto.getPhone());
        profile.setAddress(dto.getAddress());
        // No reasigno profile.setUser() en update: el dueño de un perfil no debería cambiar

        Profile updated = profileRepository.save(profile);
        return profileMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!profileRepository.existsById(id)) {
            throw new ResourceNotFoundException("Profile no encontrado con id: " + id);
        }
        profileRepository.deleteById(id);
    }
}