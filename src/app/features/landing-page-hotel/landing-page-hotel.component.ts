import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Renderer2,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// Subcomponents
import { HotelHeroNavbarComponent } from './components/hotel-hero-navbar/hotel-hero-navbar.component';
import { HotelAboutSectionComponent } from './components/hotel-about-section/hotel-about-section.component';
import { HotelPromotionsCarouselComponent } from './components/hotel-promotions-carousel/hotel-promotions-carousel.component';
import { HotelMenuSectionComponent } from './components/hotel-menu-section/hotel-menu-section.component';
import { HotelCaptureFormComponent } from './components/hotel-capture-form/hotel-capture-form.component';
import { HotelFooterComponent } from './components/hotel-footer/hotel-footer.component';

// Features
import { LealbotComponent } from '../lealbot/lealbot.component';

// State & Facade
import { HotelLandingFacadeService } from './state/hotel-landing-facade.service';

@Component({
  selector: 'app-landing-page-hotel',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [HotelLandingFacadeService],
  imports: [
    CommonModule,
    HotelHeroNavbarComponent,
    HotelAboutSectionComponent,
    HotelPromotionsCarouselComponent,
    HotelMenuSectionComponent,
    HotelCaptureFormComponent,
    HotelFooterComponent,
    LealbotComponent
  ],
  templateUrl: './landing-page-hotel.component.html',
  styleUrls: ['./landing-page-hotel.component.css']
})
export class LandingPageHotelComponent implements OnInit, OnDestroy {
  showMobileMenu = false;
  showBackToTop = false;

  constructor(
    public facade: HotelLandingFacadeService,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'hotel-bg');
    const slug = this.route.snapshot.paramMap.get('slug');
    this.facade.loadSlug(slug);
  }

  scrollToSection(selector: string): void {
    this.showMobileMenu = false;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFormSubmit(event: { value: any; reset: () => void }): void {
    this.facade.submitCustomerForm(event.value, event.reset);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hotel-bg');
  }
}
