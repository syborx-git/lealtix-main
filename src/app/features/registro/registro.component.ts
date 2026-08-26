import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// PrimeNG
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Shared
import { ConfettiComponent } from '../../confetti/confetti.component';

// Subcomponents
import { RegistroNavbarComponent } from './components/registro-navbar/registro-navbar.component';
import { RegistroStepperHeaderComponent } from './components/registro-stepper-header/registro-stepper-header.component';
import { StepPersonalInfoComponent } from './components/step-personal-info/step-personal-info.component';
import { StepPaymentStripeComponent } from './components/step-payment-stripe/step-payment-stripe.component';
import { StepConfirmationComponent } from './components/step-confirmation/step-confirmation.component';
import { RegistroFooterComponent } from './components/registro-footer/registro-footer.component';

// Facade
import { RegistrationFacadeService } from './services/registration-facade.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [RegistrationFacadeService],
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ConfettiComponent,
    RegistroNavbarComponent,
    RegistroStepperHeaderComponent,
    StepPersonalInfoComponent,
    StepPaymentStripeComponent,
    StepConfirmationComponent,
    RegistroFooterComponent
  ],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit, OnDestroy {
  private tokenParam: string = '';

  constructor(
    public facade: RegistrationFacadeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const register = params['register'];
      const token = params['token'];
      this.tokenParam = token || '';
      this.facade.validateInvitation(register, token);
    });
  }

  onNextStep(): void {
    this.facade.nextStep(this.tokenParam);
  }

  ngOnDestroy(): void {
    this.facade.cleanup();
  }
}
