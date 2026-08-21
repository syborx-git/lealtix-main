import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-lealbot-input-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="input-bar-container">
      <div class="input-wrapper">
        <input
          pInputText
          [type]="resolveHtmlInputType()"
          [(ngModel)]="inputText"
          [placeholder]="placeholder || 'Escribe tu mensaje...'"
          (keydown.enter)="onSend()"
          [disabled]="isLoading"
          class="chat-input"
        />
        <button
          pButton
          type="button"
          icon="pi pi-send"
          class="send-btn"
          [disabled]="!inputText.trim() || isLoading"
          (click)="onSend()"
        ></button>
      </div>
    </div>
  `
})
export class LealbotInputBarComponent {
  @Input() inputType: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'CONTACT' | 'DATE' | null = null;
  @Input() placeholder: string = 'Escribe tu mensaje...';
  @Input() isLoading = false;
  @Output() send = new EventEmitter<string>();

  inputText: string = '';

  onSend(): void {
    const trimmed = this.inputText.trim();
    if (trimmed && !this.isLoading) {
      this.send.emit(trimmed);
      this.inputText = '';
    }
  }

  resolveHtmlInputType(): string {
    switch (this.inputType) {
      case 'EMAIL':
        return 'email';
      case 'PHONE':
        return 'tel';
      case 'DATE':
        return 'date';
      default:
        return 'text';
    }
  }
}
