package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.ProfileRequestDto;
import com.example.ecm.DTO.Response.ProfileResponseDto;
import com.example.ecm.model.Profile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UserMapper.class
        }
)
public interface ProfileMapper {

    ProfileResponseDto toResponse(Profile profile);
    /**
     * Lista de Profile -> Lista de ProfileResponseDto.
     */
    List<ProfileResponseDto> toResponseList(List<Profile> profiles);



    /**
     * Request DTO -> Entity
     */
    @Mapping(
            source = "userId",
            target = "user",
            qualifiedByName = "mapUser"
    )
    Profile toEntity(ProfileRequestDto dto);

}
