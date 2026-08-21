import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hotel-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer id="contact" class="hotel-footer">
      <div class="hotel-container">
        <div class="footer-columns-grid">
          <div class="footer-col">
            <h4 class="footer-col-title">Dirección & Recepción</h4>
            <p *ngIf="footerData.dir"><i class="pi pi-map-marker me-2"></i>{{ footerData.dir }}</p>
            <p *ngIf="footerData.tel"><i class="pi pi-phone me-2"></i>{{ footerData.tel }}</p>
            <p *ngIf="footerData.bussinesEmail"><i class="pi pi-envelope me-2"></i>{{ footerData.bussinesEmail }}</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-col-title">Horarios de Atención</h4>
            <p style="white-space: pre-line;">{{ footerData.schelules || 'Atención 24/7' }}</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-col-title">Legal & Lealtad</h4>
            <ul class="footer-links-list">
              <li><a [routerLink]="['/privacy']">Aviso de Privacidad</a></li>
              <li><a [routerLink]="['/']">Powered by Lealtix</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <p>© 2026 {{ hotelName || 'Hotel' }}. Todos los derechos reservados. Impulsado por Lealtix.</p>
        </div>
      </div>
    </footer>
  `
})
export class HotelFooterComponent {
  @Input() footerData: any = {};
  @Input() hotelName: string = '';
}
