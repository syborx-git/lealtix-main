import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionComponent } from './subscription/subscription.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [SubscriptionComponent, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  suscripcionForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService
  ) {
    this.suscripcionForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.suscripcionForm.invalid) {
      this.suscripcionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { nombre, email } = this.suscripcionForm.value;

    this.subscriptionService.preSubscribe({ nombre, email }).subscribe({
      next: (res: any) => {
        alert('Gracias por suscribirte a Lealtix 🎉, te enviamos un correo para continuar tu registro.');
        this.suscripcionForm.reset();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error en la suscripción:', err);
        const msg = err?.error?.message || 'Hubo un problema con la suscripción o el correo ya está registrado.';
        alert(msg);
        this.loading = false;
      },
    });
  }
}

