import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="step-content">
      <div class="confirmation-content">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h3 class="confirmation-title">¡Registro Completado!</h3>
        <p class="confirmation-message">
          Tu cuenta ha sido creada exitosamente y tu pago ha sido procesado.
          Ya puedes comenzar a usar Lealtix.
        </p>

        <div class="confirmation-details">
          <div class="detail-item">
            <i class="pi pi-user"></i>
            <span>{{ fullName }}</span>
          </div>
          <div class="detail-item">
            <i class="pi pi-envelope"></i>
            <span>{{ email }}</span>
          </div>
        </div>
        <div class="confirmation-note" style="margin-top:1rem; text-align:center;">
          <i class="pi pi-envelope" style="font-size:1.6rem;color:#0ea5a4;"></i>
          <p class="fs-6 mb-0 text-secondary" style="max-width:720px;margin:0.5rem auto 0;">
            En breve recibirás un correo electrónico con tus credenciales de acceso al panel de administración de tu página en Lealtix.
            <br>Sigue las instrucciones del correo para iniciar sesión y configurar tu cuenta. Si no lo recibes en unos minutos, revisa la carpeta de spam o promociones.
          </p>
        </div>
      </div>
    </div>
  `
})
export class StepConfirmationComponent {
  @Input() fullName = '';
  @Input() email = '';
}
