// NewsletterSubscriberRepository.java
package com.example.ecm.repository;

import com.example.ecm.model.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {
    boolean existsByEmail(String email);
}