import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro-stepper-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="custom-steps" role="tablist" aria-label="Registro Steps">
      <div
        *ngFor="let item of stepItems; let i = index"
        class="custom-step"
        [class.active]="i === activeStep"
        [class.completed]="i < activeStep"
        [class.blocked]="paymentConfirmed && i < 2"
        (click)="onStepClick(i)"
      >
        <div class="custom-step-number">{{ i < activeStep ? '✓' : (i + 1) }}</div>
        <div class="custom-step-info">
          <div class="custom-step-title">{{ item.label }}</div>
          <div class="custom-step-desc">{{ item.label | lowercase }}</div>
        </div>
      </div>
    </div>
  `
})
export class RegistroStepperHeaderComponent {
  @Input() stepItems: { label: string }[] = [];
  @Input() activeStep = 0;
  @Input() paymentConfirmed = false;
  @Output() stepSelected = new EventEmitter<number>();

  onStepClick(index: number): void {
    if (!this.paymentConfirmed || index >= 2) {
      this.stepSelected.emit(index);
    }
  }
}
