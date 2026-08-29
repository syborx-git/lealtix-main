import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChatMessageUI } from '../../models/lealbot.models';
import { LealbotMessageBubbleComponent } from '../lealbot-message-bubble/lealbot-message-bubble.component';

@Component({
  selector: 'app-lealbot-messages-list',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, LealbotMessageBubbleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="messages-container" #messagesContainer>
      <div class="messages-scroll">
        <app-lealbot-message-bubble
          *ngFor="let msg of messages"
          [message]="msg"
        ></app-lealbot-message-bubble>

        <!-- Indicador de carga / typing -->
        <div *ngIf="isLoading" class="typing-indicator">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  `
})
export class LealbotMessagesListComponent implements AfterViewChecked {
  @Input() messages: readonly ChatMessageUI[] = [];
  @Input() isLoading = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  public triggerScroll(): void {
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      // Ignorar errores de scroll
    }
  }
}
