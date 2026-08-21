import { AbstractControl } from '@angular/forms';

/**
 * Validador opcional para números telefónicos a 10 dígitos
 */
export function optionalPhoneValidator(control: AbstractControl): { [key: string]: any } | null {
  const value = control.value;
  if (!value || value.trim() === '') {
    return null; // Si está vacío, es válido porque es opcional
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length === 0) {
    return null;
  }
  return digitsOnly.length === 10 ? null : { invalidPhone: true };
}

/**
 * Validador estricto para números telefónicos requeridos de 10 dígitos
 */
export function requiredPhoneValidator(control: AbstractControl): { [key: string]: any } | null {
  const value = control.value;
  if (!value) {
    return { required: true };
  }
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length === 10 ? null : { invalidPhone: true };
}
