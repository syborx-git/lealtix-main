import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-step-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="step-content">
      <div class="step-header">
        <h3 class="step-title">
          <i class="pi pi-user step-icon"></i>
          Información Personal
        </h3>
        <p class="step-description">Completa tus datos básicos para continuar</p>
      </div>

      <form [formGroup]="formGroup" class="step-form">
        <div formGroupName="tenant">
          <div class="form-grid">
            <!-- Nombre Completo -->
            <div class="form-field">
              <label for="fullName" class="field-label">
                Nombre completo <span class="required">*</span>
              </label>
              <input
                id="fullName"
                pInputText
                formControlName="fullName"
                class="w-full"
                [class.p-invalid]="isFieldInvalid('fullName')"
                placeholder="Ingresa tu nombre completo"
              />
              <small *ngIf="isFieldInvalid('fullName')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> El nombre es requerido
              </small>
            </div>

            <!-- Fecha de Nacimiento -->
            <div class="form-field">
              <label for="fechaNacimiento" class="field-label">
                Fecha de nacimiento <span class="required">*</span>
              </label>
              <input
                id="fechaNacimiento"
                pInputText
                type="date"
                formControlName="fechaNacimiento"
                class="w-full"
                [class.p-invalid]="isFieldInvalid('fechaNacimiento')"
              />
              <small *ngIf="hasError('fechaNacimiento', 'required')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> La fecha de nacimiento es requerida
              </small>
              <small *ngIf="hasError('fechaNacimiento', 'minAge')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> Debes tener al menos 18 años
              </small>
              <small *ngIf="hasError('fechaNacimiento', 'invalidDate')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> Fecha inválida
              </small>
            </div>

            <!-- Email -->
            <div class="form-field full-col">
              <label for="email" class="field-label">
                Correo electrónico <span class="required">*</span>
              </label>
              <input
                pInputText
                id="email"
                type="email"
                formControlName="email"
                class="w-full"
                [class.p-invalid]="isFieldInvalid('email')"
                placeholder="ejemplo@correo.com"
              />
              <small *ngIf="isFieldInvalid('email')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> Ingresa un email válido
              </small>
            </div>

            <!-- Teléfono -->
            <div class="form-field">
              <label for="telefono" class="field-label">
                Número de teléfono
              </label>
              <p-inputNumber
                id="telefono"
                formControlName="telefono"
                class="w-full"
                placeholder="10 dígitos"
                [useGrouping]="false"
                [maxlength]="10"
                [min]="1000000000"
                [max]="9999999999"
                mode="decimal"
              ></p-inputNumber>
              <small class="field-help">
                <i class="pi pi-info-circle"></i> Formato: 5512345678
              </small>
            </div>

            <!-- Contraseña -->
            <div class="form-field">
              <label for="password" class="field-label">
                Contraseña <span class="required">*</span>
              </label>
              <div class="password-field">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  pInputText
                  formControlName="password"
                  class="password-input"
                  [class.p-invalid]="isFieldInvalid('password')"
                  placeholder="Crea una contraseña segura"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="togglePassword.emit()"
                >
                  <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
              <small *ngIf="isFieldInvalid('password')" class="p-error">
                <i class="pi pi-exclamation-circle"></i> La contraseña es requerida
              </small>
            </div>
          </div>
        </div>
      </form>

      <div class="privacy-notice">
        <i class="pi pi-shield"></i>
        <p>Al registrarte aceptas recibir promociones del negocio. Tus datos están protegidos y no se comparten con terceros. <br><a [routerLink]="['/privacy']">Ver Aviso de Privacidad</a></p>
      </div>

      <div class="step-actions">
        <p-button
          label="Continuar"
          icon="pi pi-arrow-right"
          iconPos="right"
          styleClass="primary-button full-width"
          (onClick)="continue.emit()"
          [loading]="isValidating"
        ></p-button>
      </div>
    </div>
  `
})
export class StepPersonalInfoComponent {
  @Input() formGroup!: FormGroup;
  @Input() showPassword = false;
  @Input() isValidating = false;
  @Output() togglePassword = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  get tenantControls(): FormGroup | null {
    return this.formGroup?.get('tenant') as FormGroup;
  }

  isFieldInvalid(fieldName: string): boolean {
    const ctrl = this.tenantControls?.get(fieldName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hasError(fieldName: string, errorName: string): boolean {
    const ctrl = this.tenantControls?.get(fieldName);
    return !!(ctrl && ctrl.hasError(errorName) && (ctrl.dirty || ctrl.touched));
  }
}
