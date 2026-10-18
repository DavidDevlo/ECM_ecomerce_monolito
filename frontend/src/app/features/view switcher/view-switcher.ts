import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViewModeService, ViewRole } from '../../core/services/view-mode.service';

@Component({
  selector: 'app-view-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-switcher.html',
  styleUrl: './view-switcher.css'
})
export class ViewSwitcher {

  viewMode = inject(ViewModeService);
  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  selectRole(role: ViewRole): void {
    this.viewMode.setView(role);
    this.closeMenu();
  }

  roleLabel(role: ViewRole | null): string {
    switch (role) {
      case 'CLIENTE': return 'Cliente';
      case 'VENDEDOR': return 'Vendedor';
      case 'ADMIN': return 'Admin';
      default: return '';
    }
  }
}
