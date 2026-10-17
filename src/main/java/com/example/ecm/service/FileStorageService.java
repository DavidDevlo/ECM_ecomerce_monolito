package com.example.ecm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    // Carpeta física donde se guardan los archivos (relativa a donde corre la app)
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png", "image/jpeg", "image/webp"
    );

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Formato no permitido. Usa PNG, JPG o WEBP.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo de 5MB.");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalName = StringUtils.cleanPath(
                    file.getOriginalFilename() == null ? "" : file.getOriginalFilename()
            );
            String extension = getExtension(originalName);
            String storedName = UUID.randomUUID() + extension;

            Path targetPath = uploadPath.resolve(storedName).normalize();

            // Evita path traversal (que el nombre del archivo intente salir de la carpeta)
            if (!targetPath.getParent().equals(uploadPath)) {
                throw new IllegalArgumentException("Nombre de archivo inválido.");
            }

            Files.copy(file.getInputStream(), targetPath);

            // URL pública: coincide con el mapping configurado en WebConfig
            return "/uploads/" + storedName;

        } catch (IOException e) {
            log.error("Error guardando archivo", e);
            throw new UncheckedIOException("No se pudo guardar el archivo.", e);
        }
    }

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot < 0 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot); // incluye el punto, ej: ".png"
    }
}
