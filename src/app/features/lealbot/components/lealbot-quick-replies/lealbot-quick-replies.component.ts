import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogChip } from '../../models/lealbot.models';

@Component({
  selector: 'app-lealbot-quick-replies',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="quickReplies && quickReplies.length > 0" class="quick-replies-container">
      <button
        *ngFor="let chip of quickReplies"
        type="button"
        class="quick-reply-chip"
        [disabled]="chip.disabled"
        (click)="chipSelected.emit(chip)"
      >
        <i *ngIf="chip.icon" [class]="chip.icon" class="chip-icon"></i>
        <span>{{ chip.label }}</span>
      </button>
    </div>
  `
})
export class LealbotQuickRepliesComponent {
  @Input() quickReplies: readonly DialogChip[] = [];
  @Output() chipSelected = new EventEmitter<DialogChip>();
}
