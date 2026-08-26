import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-hero-navbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hotel-hero-header">
      <nav class="hotel-nav">
        <div class="hotel-nav-container">
          <div class="hotel-logo-box">
            <img *ngIf="navBarData.logoUrl" [src]="navBarData.logoUrl" [alt]="navBarData.bussinessName" class="hotel-logo-img" />
            <div class="hotel-brand-text">
              <span class="hotel-name">{{ navBarData.bussinessName || 'Aurora Grand' }}</span>
              <span class="hotel-tagline">{{ navBarData.since }}</span>
            </div>
          </div>

          <!-- Desktop Navigation -->
          <ul class="hotel-menu-links">
            <li><a href="#about" (click)="navigateSection.emit('#about')">Acerca del Hotel</a></li>
            <li *ngIf="hasPromotions"><a href="#promotions" (click)="navigateSection.emit('#promotions')">Promociones</a></li>
            <li><a href="#menu" (click)="navigateSection.emit('#menu')">Gastronomía & Menú</a></li>
            <li><a href="#join" (click)="navigateSection.emit('#join')">Membresía</a></li>
            <li><a href="#contact" (click)="navigateSection.emit('#contact')">Contacto</a></li>
          </ul>

          <div class="hotel-nav-actions">
            <button type="button" class="btn-hotel-primary" (click)="navigateSection.emit('#join')">
              Unirse a Lealtad
            </button>
            <button type="button" class="btn-mobile-toggle" (click)="toggleMobile.emit()">
              <i class="pi pi-bars"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Drawer -->
        <div *ngIf="showMobileMenu" class="hotel-mobile-menu">
          <ul>
            <li><a href="#about" (click)="navigateSection.emit('#about')">Acerca del Hotel</a></li>
            <li *ngIf="hasPromotions"><a href="#promotions" (click)="navigateSection.emit('#promotions')">Promociones</a></li>
            <li><a href="#menu" (click)="navigateSection.emit('#menu')">Gastronomía & Menú</a></li>
            <li><a href="#join" (click)="navigateSection.emit('#join')">Membresía</a></li>
            <li><a href="#contact" (click)="navigateSection.emit('#contact')">Contacto</a></li>
          </ul>
        </div>
      </nav>

      <!-- Hero Banner -->
      <div class="hotel-hero-content">
        <div class="hero-overlay"></div>
        <div class="hero-text-box">
          <span class="hero-badge">Huéspedes Distinguidos</span>
          <h1 class="hero-title">{{ navBarData.bussinessName || 'Experiencia Hotelera Exclusiva' }}</h1>
          <p class="hero-subtitle">{{ navBarData.since || 'Cada estancia merece recompensas excepcionales.' }}</p>
          <div class="hero-buttons">
            <button type="button" class="btn-gold" (click)="navigateSection.emit('#join')">
              Obtener Beneficios Exclusivos
            </button>
            <button type="button" class="btn-glass" (click)="navigateSection.emit('#menu')">
              Explorar Menú & Servicios
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HotelHeroNavbarComponent {
  @Input() navBarData: any = {};
  @Input() hasPromotions = false;
  @Input() showMobileMenu = false;
  @Output() navigateSection = new EventEmitter<string>();
  @Output() toggleMobile = new EventEmitter<void>();
}
