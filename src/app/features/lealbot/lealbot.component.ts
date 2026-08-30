import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewEncapsulation,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Subcomponents
import { LealbotHeaderComponent } from './components/lealbot-header/lealbot-header.component';
import { LealbotMessagesListComponent } from './components/lealbot-messages-list/lealbot-messages-list.component';
import { LealbotQuickRepliesComponent } from './components/lealbot-quick-replies/lealbot-quick-replies.component';
import { LealbotInputBarComponent } from './components/lealbot-input-bar/lealbot-input-bar.component';
import { LealbotCartDrawerComponent } from './components/lealbot-cart-drawer/lealbot-cart-drawer.component';
import { LealbotMenuCatalogComponent } from './components/lealbot-menu-catalog/lealbot-menu-catalog.component';

// State & Facade
import { LealbotFacade } from './state/lealbot-facade.service';

@Component({
  selector: 'app-lealbot',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [LealbotFacade],
  imports: [
    CommonModule,
    LealbotHeaderComponent,
    LealbotMessagesListComponent,
    LealbotQuickRepliesComponent,
    LealbotInputBarComponent,
    LealbotCartDrawerComponent,
    LealbotMenuCatalogComponent
  ],
  templateUrl: './lealbot.component.html',
  styleUrls: ['./lealbot.component.scss']
})
export class LealbotComponent implements OnInit, OnDestroy {
  @Input() tenantId: number = 1;
  @ViewChild('messagesList') private messagesList!: LealbotMessagesListComponent;

  isCartOpen = false;
  isCatalogOpen = false;

  constructor(public facade: LealbotFacade) {}

  ngOnInit(): void {
    this.facade.initSession(this.tenantId);
  }

  onToggle(): void {
    this.facade.toggleChat();
    setTimeout(() => this.messagesList?.triggerScroll(), 100);
  }

  onSendMessage(text: string): void {
    this.facade.handleUserInput(text);
    setTimeout(() => this.messagesList?.triggerScroll(), 100);
  }

  onSelectQuickReply(chip: any): void {
    if (chip.value === 'MENU') {
      this.isCatalogOpen = true;
      return;
    }
    if (chip.value === 'CART') {
      this.isCartOpen = true;
      return;
    }
    if (chip.value === 'CLOSE') {
      this.facade.toggleChat();
      return;
    }
    this.facade.selectQuickReply(chip);
    setTimeout(() => this.messagesList?.triggerScroll(), 100);
  }

  onAddProduct(product: any): void {
    this.facade.addToCart(product);
    this.isCatalogOpen = false;
    setTimeout(() => this.messagesList?.triggerScroll(), 100);
  }

  onCheckout(): void {
    this.isCartOpen = false;
    this.facade.handleUserInput('CONFIRMAR');
    setTimeout(() => this.messagesList?.triggerScroll(), 100);
  }

  ngOnDestroy(): void {
    this.facade.abandonSession();
  }
}
