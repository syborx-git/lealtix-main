import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageUI } from '../../models/lealbot.models';

@Component({
  selector: 'app-lealbot-message-bubble',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="message-wrapper"
      [ngClass]="{
        'user-message': message.sender === 'USER',
        'bot-message': message.sender === 'BOT',
        'system-message': message.sender === 'SYSTEM'
      }"
    >
      <div *ngIf="message.sender === 'BOT'" class="message-avatar">
        <i class="pi pi-bolt"></i>
      </div>

      <div class="message-bubble">
        <p class="message-text">{{ message.content }}</p>
        <span *ngIf="message.timestamp" class="message-time">
          {{ message.timestamp | date:'shortTime' }}
        </span>
      </div>
    </div>
  `
})
export class LealbotMessageBubbleComponent {
  @Input() message!: ChatMessageUI;
}
