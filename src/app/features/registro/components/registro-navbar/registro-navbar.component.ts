import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container px-5">
        <a class="navbar-brand fw-bold" href="#">
          <img src="assets/img/lealtix_logo_transp.png" alt="Lealtix Logo" width="40" height="40" class="me-2" />
          Lealtix
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" [routerLink]="['/']">Inicio</a></li>
            <li class="nav-item"><a class="nav-link" href="#">Beneficios</a></li>
            <li class="nav-item"><a class="nav-link" href="#">Precios</a></li>
            <li class="nav-item"><a class="nav-link" href="#">Contacto</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class RegistroNavbarComponent {}
