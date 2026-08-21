import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <h5>Lealtix</h5>
        </div>
        <div class="footer-links">
          <a [routerLink]="['/']">Inicio</a>
          <a href="#">Beneficios</a>
          <a href="#">Precios</a>
          <a [routerLink]="['/privacy']">Aviso de Privacidad</a>
          <a href="#">Contacto</a>
        </div>
        <div class="footer-copyright">
          <p>© 2026 Lealtix. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `
})
export class RegistroFooterComponent {}
