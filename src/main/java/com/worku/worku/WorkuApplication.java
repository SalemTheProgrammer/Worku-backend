package com.worku.worku;

import com.worku.worku.model.Role;
import com.worku.worku.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.Arrays;

@SpringBootApplication(scanBasePackages = "com.worku.worku")
@EnableJpaRepositories(basePackages = "com.worku.worku.repository")
@EnableJpaAuditing
@EnableTransactionManagement
public class WorkuApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkuApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(RoleRepository roleRepository) {
        return args -> {
            // Initialize default roles if they don't exist
            Arrays.stream(Role.RoleType.values()).forEach(roleType -> {
                String roleName = roleType.name();
                if (!roleRepository.existsByName(roleName)) {
                    Role role = Role.builder()
                            .name(roleName)
                            .description("Default role for " + 
                                roleName.substring("ROLE_".length()).toLowerCase())
                            .build();
                    roleRepository.save(role);
                }
            });
        };
    }
}
