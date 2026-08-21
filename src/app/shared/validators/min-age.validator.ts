import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Validador reactivo para verificar edad mínima a partir de una fecha de nacimiento (YYYY-MM-DD)
 * @param minAge Edad mínima requerida en años
 */
export function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const birthDate = new Date(value);
    if (isNaN(birthDate.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
  };
}
