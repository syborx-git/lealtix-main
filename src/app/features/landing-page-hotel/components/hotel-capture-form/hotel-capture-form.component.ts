import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { minAgeValidator } from '../../../../shared/validators/min-age.validator';
import { optionalPhoneValidator } from '../../../../shared/validators/phone.validator';

@Component({
  selector: 'app-hotel-capture-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="join" class="hotel-capture-section">
      <div class="hotel-container">
        <div class="capture-card">
          <div class="capture-header">
            <span class="section-label">Club de Lealtad</span>
            <h2 class="section-heading">Únete a Nuestro Programa Exclusivo</h2>
            <p class="capture-subtitle">Recibe promociones VIP, ascensos de habitación y beneficios gastronómicos.</p>
          </div>

          <!-- Success Alert -->
          <div *ngIf="successMessage" class="hotel-alert alert-success">
            <i class="pi pi-check-circle"></i>
            <span>{{ successMessage }}</span>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="hotel-alert alert-error">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <form [formGroup]="form" class="hotel-form" (ngSubmit)="onSubmit()">
            <div class="hotel-form-grid">
              <div class="hotel-input-group">
                <label for="name">Nombre Completo *</label>
                <input id="name" type="text" formControlName="name" placeholder="Tu nombre" />
                <small *ngIf="isInvalid('name')" class="input-error">Ingresa tu nombre completo</small>
              </div>

              <div class="hotel-input-group">
                <label for="email">Correo Electrónico *</label>
                <input id="email" type="email" formControlName="email" placeholder="ejemplo@correo.com" />
                <small *ngIf="isInvalid('email')" class="input-error">Ingresa un correo válido</small>
              </div>

              <div class="hotel-input-group">
                <label for="birthDate">Fecha de Nacimiento *</label>
                <input id="birthDate" type="date" formControlName="birthDate" />
                <small *ngIf="isInvalid('birthDate')" class="input-error">Debes ser mayor de 13 años</small>
              </div>

              <div class="hotel-input-group">
                <label for="gender">Género *</label>
                <select id="gender" formControlName="gender">
                  <option value="" disabled selected>Selecciona tu género</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
                <small *ngIf="isInvalid('gender')" class="input-error">Selecciona una opción</small>
              </div>

              <div class="hotel-input-group">
                <label for="phone">Teléfono Móvil (10 dígitos)</label>
                <input id="phone" type="tel" formControlName="phone" placeholder="5512345678" maxlength="10" />
                <small *ngIf="isInvalid('phone')" class="input-error">Número a 10 dígitos</small>
              </div>
            </div>

            <div class="terms-checkbox">
              <label>
                <input type="checkbox" formControlName="acceptedPromotions" />
                Deseo recibir ofertas exclusivas y novedades por correo o WhatsApp.
              </label>
            </div>

            <div class="form-submit-row">
              <button type="submit" class="btn-hotel-submit" [disabled]="isLoading">
                <span *ngIf="!isLoading">Obtener Membresía de Lealtad</span>
                <span *ngIf="isLoading">Procesando...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `
})
export class HotelCaptureFormComponent implements OnInit {
  @Input() isLoading = false;
  @Input() successMessage: string | null = null;
  @Input() errorMessage: string | null = null;
  @Output() formSubmitted = new EventEmitter<{ value: any; reset: () => void }>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(140)]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', [Validators.required]],
      birthDate: ['', [Validators.required, minAgeValidator(13)]],
      phone: ['', [optionalPhoneValidator]],
      acceptedPromotions: [false]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmitted.emit({
      value: this.form.value,
      reset: () => this.form.reset()
    });
  }
}
