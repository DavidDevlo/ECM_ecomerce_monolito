import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {
  stack = [
    { label: 'Frontend', value: 'Angular 18 (standalone, signals, SSR)' },
    { label: 'Backend', value: 'Spring Boot + Spring Security (JWT)' },
    { label: 'Base de datos', value: 'JPA / Hibernate' },
    { label: 'Roles', value: 'Cliente, Vendedor, Admin' }
  ];
}
