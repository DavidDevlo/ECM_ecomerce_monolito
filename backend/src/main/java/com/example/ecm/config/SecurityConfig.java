package com.example.ecm.config;

import com.example.ecm.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    // El bean CorsConfigurationSource ahora vive únicamente en CorsConfig.java
    // (lee el origen permitido desde app.cors.allowed-origins / variable de entorno CORS_ALLOWED_ORIGINS)

    // =========================
    // SECURITY
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(cors -> {}) // usa el bean CorsConfigurationSource de CorsConfig
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // Login / Auth
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // Registro
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users"
                        ).permitAll()

                        // Catálogo público
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/categories/**",
                                "/api/products/**"
                        ).permitAll()

                        // Imágenes servidas como archivos estáticos (sin esto, <img> no puede cargarlas
                        // porque el navegador no manda el JWT en las peticiones de imagen)
                        .requestMatchers(
                                HttpMethod.GET,
                                "/uploads/**"
                        ).permitAll()

                                // Newsletter: cualquiera puede suscribirse
                        .requestMatchers(HttpMethod.POST, "/api/newsletter").permitAll()

                                // Reseñas: lectura pública, parte del catálogo
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/shipping/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/collections", "/api/collections/**").permitAll()

                        // Todo lo demás requiere JWT
                        .anyRequest().authenticated()
                )

                .authenticationProvider(
                        authenticationProvider()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}