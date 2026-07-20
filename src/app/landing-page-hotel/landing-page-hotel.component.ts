import { Component, HostListener, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantLandingPageService } from '../services/tenant-landing-page.service';
import { ProductsMenuService } from '../services/products-menu.service';
import { TenantCustomerService } from '../services/tenant-customer.service';
import { LealbotComponent } from '../lealbot/lealbot.component';

@Component({
  selector: 'app-landing-page-hotel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LealbotComponent
  ],
  templateUrl: './landing-page-hotel.component.html',
  styleUrls: ['./landing-page-hotel.component.css'],
  providers: [TenantCustomerService]
})
export class LandingPageHotelComponent implements OnInit, OnDestroy {
  navBarData = {
    logoUrl: '',
    bussinessName: '',
    since: ''
  };

  aboutData = {
    since: '',
    story: '',
    vision: ''
  };

  footerData = {
    dir: '',
    tel: '',
    bussinesEmail: '',
    twiter: '',
    facebook: '',
    linkedin: '',
    instagram: '',
    tiktok: '',
    schelules: ''
  };

  menuCategorias: any[] = [];
  selectedCategory: string = 'Todos';
  tenantId: number = 0;
  hasPromotions: boolean = false;
  promotions: any[] = [];

  // Form states
  customerForm!: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // View toggles
  showMobileMenu = false;
  showBackToTop = false;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private tenantLandingPageService: TenantLandingPageService,
    private productsMenuService: ProductsMenuService,
    private tenantCustomerService: TenantCustomerService
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.body, 'hotel-bg');
    
    // Setup form
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(140), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', [Validators.required]],
      birthDate: ['', [Validators.required, this.minAgeValidator(13)]],
      phone: ['', [this.optionalPhoneValidator]],
      acceptedPromotions: [false]
    });

    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug === 'demo') {
      this.loadDummyData();
    } else if (slug) {
      this.loadTenantData(slug);
    }
  }

  loadTenantData(slug: string) {
    this.tenantLandingPageService.getDatosPorSlug(slug).subscribe({
      next: (data: any) => {
        this.tenantId = data.object?.tenant?.id;
        const tenantObj = data.object?.tenant || {};
        
        this.navBarData = {
          logoUrl: tenantObj.logoUrl || '',
          bussinessName: tenantObj.bussinessName || tenantObj.nombreNegocio || tenantObj.nombre || '',
          since: tenantObj.slogan || ''
        };
        
        this.aboutData = {
          since: data.object?.tenant?.slogan || '',
          story: data.object?.tenantConfig?.history || '',
          vision: data.object?.tenantConfig?.vision || ''
        };
        
        const tc = data.object?.tenantConfig || {};
        const sanitize = (v: any) => {
          if (v === null || v === undefined) return '';
          const s = String(v).trim();
          if (s === '' || s === '#') return '';
          return s;
        };

        this.footerData = {
          dir: data.object?.tenant?.direccion || '',
          tel: data.object?.tenant?.telefono || '',
          bussinesEmail: data.object?.user?.email || '',
          twiter: sanitize(tc.twitter),
          facebook: sanitize(tc.facebook),
          linkedin: sanitize(tc.linkedin),
          instagram: sanitize(tc.instagram),
          tiktok: sanitize(tc.tiktok),
          schelules: data.object?.tenant?.schedules || ''
        };

        if (this.tenantId && this.tenantId > 0) {
          this.getProductsMenuByTenantId();
          this.loadPromotions();
        }
      },
      error: (err: any) => {
        console.error('Error al cargar los datos del hotel:', err);
        this.router.navigate(['/error']);
      }
    });
  }

  loadDummyData() {
    this.navBarData = {
      logoUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtW840kFN-codoyT1BMRgiHI8dqkjzzKDEmL6dqWfT2KDgzJRdc696s5GsHVshSWVKnqkSXfUS98Fj_J37TQYIrN9QZVsFfK5W_YCtsVAkT_rDkcAZrSHl3Q2vFPiF7_pUp71cFzehk8wnMk8x9onjMNahc-D3dQ8uFaAI83_KUCiz_3xt6Mhfj9Jw1AqXsq-Oc30IRNTGRsDuUooWQFgKCQQFLL7mu2ysxqZi0epSY3I6-97KaBf3we3M',
      bussinessName: 'Aurora Grand Hotel',
      since: 'Cada estancia merece una recompensa.'
    };
    
    this.aboutData = {
      since: 'Desde 1990',
      story: 'Aurora Grand es más que un destino; es una experiencia de serenidad y exclusividad, diseñada para ofrecer la máxima tranquilidad lujosa.',
      vision: 'Ser el hotel boutique predilecto a nivel nacional, combinando confort contemporáneo con una oferta gastronómica excepcional y servicio digital concierge sin fricciones.'
    };

    this.footerData = {
      dir: 'Av. Paseo de la Reforma 250, Juárez, Ciudad de México',
      tel: '+52 55 5000 6000',
      bussinesEmail: 'concierge@auroragrand.com',
      twiter: '#x',
      facebook: '#fb',
      linkedin: '#in',
      instagram: '#in',
      tiktok: '#tt',
      schelules: 'Recepción 24/7\nRestaurante: 7:00 a 23:00 Hrs.\nRoom Service: 24/7'
    };

    // Dummy promotions matching mockup
    this.promotions = [
      {
        title: 'Desayunos Inolvidables',
        description: 'Reserve con anticipación y disfrute de un descuento especial en nuestro menú de desayunos a la carta.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmk_m3FVMJhdp45BNsUqH_odyZdZ0zbsXnHYHC3WN2LMTP3PSerd7WvoBulxThMqhYzbN6ywca7vnyZ03B7I0rat1OuktCBnUi5rspKOqMsWuHwWwEP9trF1wE7mzEzUcnyv5J4poqkirS83xs7RHP_fTAPTwgXrA43vKGV2G7_QjBHwUSzpNOkBmLwQxHW8teW_qtqDOysy5TkmT0mKQZ63hYTGmppWQ4JkOU8zWeynLNkABH-WlX',
        tag: '-20% Descuento',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      },
      {
        title: 'Lobby Bar Sessions',
        description: '2x1 en coctelería de autor todos los días de 18:00 a 20:00 hrs.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4ltEBBzBlbkulIW9uovEyijDhSFZuW2M4AvBsV3f_dEUZ9kCM7-opMMWPGHImlbzJtphaeExZ42hkqHOSWYXqFlrZ0znrbPU-yGmni1-N9gWIGbRSCdd6dr-hLgMhQiZ7h5j4daGdeouFimyeBimtCJQWUKf7C3l6_sdWR-ZQW7XcByyOMR7oqn6-wXJUkS_suFBEtednPMpA1MpLzy3LisNDDDyUBdtOQMv0um-eVhtVI9Fut_OP',
        tag: 'Happy Hour',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      }
    ];
    this.hasPromotions = true;

    // Dummy categories matching mockup
    this.menuCategorias = [
      {
        nombre: 'Restaurante Principal',
        productos: [
          {
            precio: '$320',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcVrKXGEc9WebsuvPJnfSusg1X_E7fAXiL2BnDexhUEVB4ARw7zH7AXmE2Ui3EWiSHhEzle_zDowDjENEP7i_Sxp-O3rp7dsFSEaX_vdMxaodTb67WG0yafGxyBBybwRW51HZDEaKR1fDoAgPoI_3J7u7FyiaDDdXE2NkBxK0uskXIXO1N7Ij72YkD0RAeYSFOD8D6PlKIHbQWTP-F2QEAlSWKnssRZBizhBtzuYoUGnLJ0a2Vpx1_',
            prod: 'Corte Premium Aurora',
            descProd: 'Un corte de carne selecto a la parrilla servido con guarnición fina de espárragos y puré trufado.'
          },
          {
            precio: '$280',
            img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
            prod: 'Salmón Glaseado',
            descProd: 'Salmón fresco glaseado con miel de cítricos y jengibre sobre una cama de quinoa orgánica.'
          }
        ]
      },
      {
        nombre: 'Room Service 24/7',
        productos: [
          {
            precio: '$180',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LIuZBbAdvCVAPh2h-XazjRl693ckEo_tZsRJk0TbUBm9QPh7ORxoXDcyOznQdDcBkGW7jzZegRxxvOuf5tDcXk38rFP3Ztsq_d54vnudtHK2dNPy1rPxiMEq9mymeKt4lwOPYcdPUE1jEEl_md-7qjDz4GADroPbqNbHLpyr5AnaYZgI90fLXaI08UXqTkpXw3KyGwS4tXJ59LXsMcQsiy8cRqW5SCKAPOTsVcw1sIJSmiszTW9z',
            prod: 'Club Sándwich Aurora',
            descProd: 'Pechuga de pavo, tocino crujiente, queso suizo, lechuga y tomate en pan artesanal, con papas fritas.'
          }
        ]
      },
      {
        nombre: 'Cafetería & Postres',
        productos: [
          {
            precio: '$75',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbnkgXWpbH-Lh7RTfnl4Rpv2gQCWRZ2Ka9Sle5xQZ4G9eTo3vkKv09GjlGQ_1sT6Wf9Sne0GaDGnPyP_plwJio5GfAonz1lF282NlNuHoUvlbQDe4ma7oxhj_UeJy8GQKQjczg-97ZRuEAKSmnwukTH2zKGOMBQ4l5p1eQdgJ79-ShpSwBEjWSGX8dPBS_pgd839MYNnpOiN2h2A_VbaR5MX0tz_lApVNOlXMDbiIVet6YwaS7jaFB',
            prod: 'Café Latte Especial',
            descProd: 'Café de especialidad preparado por nuestros baristas, con un delicado arte latte.'
          }
        ]
      },
      {
        nombre: 'Lobby Bar & Tapas',
        productos: [
          {
            precio: '$190',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDvVFtv-Ee01dxip3DGeeCPgbAWpNdZQdTJs8jZCjV9lLBleZd1E9inUdiyFxr_IadgmZgbgyB3nPhYptXNZFwoM861EFtGsGw0phrRIyfJbaNHFNOeE0bh1jNdx6hCOd3vpSBmRgYjhTqd4l0LaPbfUJASNomg2iZmvTqqSk62kfSJdwKmkgaRAIfZtNaogiuKVKgQrmQ7Q_ASu5iLjW4VSH7LMVBmqzx4vCB0bRV2zd7nmVjolMs',
            prod: 'Cóctel Aurora Infusion',
            descProd: 'Nuestra ginebra de la casa infusionada con frutos rojos frescos y un toque de tónica premium.'
          }
        ]
      }
    ];
  }

  getProductsMenuByTenantId() {
    this.productsMenuService.getProductsByTenantId(this.tenantId).subscribe({
      next: (data: any) => {
        this.menuCategorias = this.mapProductsToMenuCategorias(data.object || []);
      },
      error: (err: any) => {
        console.error('Error al cargar el menú de productos:', err);
      }
    });
  }

  private mapProductsToMenuCategorias(products: any[]) {
    if (!Array.isArray(products)) return [];

    const categoriasMap: { [key: string]: any } = {};

    products.forEach(p => {
      if (p && p.isActive === false) return;
      if (p && p.categoryIsActive === false) return;

      const catName = p.categoryName || 'Sin categoría';
      if (!categoriasMap[catName]) {
        categoriasMap[catName] = {
          nombre: catName,
          productos: [] as any[]
        };
      }

      categoriasMap[catName].productos.push({
        precio: p.price != null ? `$${p.price}` : '$0',
        img: this.getOptimizedImage(p.imageUrl) || '',
        prod: p.name || '',
        descProd: p.description || ''
      });
    });

    return Object.keys(categoriasMap)
      .map(k => categoriasMap[k])
      .filter((cat: any) => Array.isArray(cat.productos) && cat.productos.length > 0);
  }

  getOptimizedImage(url: string): string {
    if (!url) return '';
    return url.replace('/upload/', '/upload/w_400,h_250,c_limit,f_auto,q_auto/');
  }

  loadPromotions() {
    this.tenantLandingPageService.getActivePromotions(this.tenantId).subscribe({
      next: (response) => {
        let rawPromos: any[] = [];
        if (!response) {
          rawPromos = [];
        } else if (Array.isArray(response)) {
          rawPromos = response;
        } else if (response.object && Array.isArray(response.object)) {
          rawPromos = response.object;
        } else if (response.code === 200 && response.object) {
          rawPromos = response.object;
        }

        this.promotions = rawPromos.map((p: any, idx: number) => {
          if (p && p.promotionReward && p.promotionReward.usageLimit == null) {
            p.promotionReward.usageLimit = 1;
          }
          return {
            title: p.title || '',
            description: p.promotionReward?.description || p.description || '',
            imageUrl: p.imageUrl || '',
            tag: idx === 0 ? '-20% Descuento' : (idx === 1 ? 'Happy Hour' : 'Exclusivo'),
            startDate: p.startDate,
            endDate: p.endDate
          };
        });

        this.hasPromotions = this.promotions.length > 0;
      },
      error: () => {
        this.hasPromotions = false;
        this.promotions = [];
      }
    });
  }

  // Filters & helpers
  getCategoryNames(): string[] {
    const uniqueNames = [...new Set(this.menuCategorias.map(cat => cat.nombre))];
    return ['Todos', ...uniqueNames];
  }

  getFilteredProducts(): any[] {
    if (this.selectedCategory === 'Todos') {
      // Flatten all products
      const list: any[] = [];
      this.menuCategorias.forEach(cat => {
        cat.productos.forEach((p: any) => {
          list.push({
            ...p,
            categoriaName: cat.nombre
          });
        });
      });
      return list;
    } else {
      const match = this.menuCategorias.find(cat => cat.nombre === this.selectedCategory);
      if (!match) return [];
      return match.productos.map((p: any) => ({
        ...p,
        categoriaName: match.nombre
      }));
    }
  }

  selectCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
  }

  getCategoryIcon(categoryName: string): string {
    if (!categoryName) return 'restaurant';
    const name = categoryName.toLowerCase();
    if (name.includes('restaurant') || name.includes('comida') || name.includes('plat') || name.includes('principal')) {
      return 'restaurant';
    }
    if (name.includes('room') || name.includes('servicio') || name.includes('habita')) {
      return 'room_service';
    }
    if (name.includes('cafe') || name.includes('postre') || name.includes('desayuno') || name.includes('dulce') || name.includes('past')) {
      return 'local_cafe';
    }
    if (name.includes('bar') || name.includes('vino') || name.includes('coctel') || name.includes('bebida') || name.includes('wine') || name.includes('trago')) {
      return 'wine_bar';
    }
    return 'restaurant';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }

  // Validators & Form handlers
  minAgeValidator(minAge: number) {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;
      const birth = new Date(value);
      if (isNaN(birth.getTime())) {
        return { invalidDate: true };
      }
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
    };
  }

  optionalPhoneValidator(control: AbstractControl) {
    const v = control.value;
    if (v === null || v === undefined || v === '') return null;
    const cleaned = String(v).replace(/\D+/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      return { invalidPhone: true };
    }
    return null;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D+/g, '').slice(0, 10);
    if (input.value !== cleaned) {
      input.value = cleaned;
    }
    const control = this.customerForm.get('phone');
    if (control && control.value !== cleaned) {
      control.setValue(cleaned, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const formValue = this.customerForm.value;
    const genderValue = formValue.gender ? String(formValue.gender).toLowerCase() : formValue.gender;
    const phoneClean = formValue.phone ? String(formValue.phone).replace(/\D+/g, '') : undefined;

    const payload: any = {
      tenantId: this.tenantId,
      name: formValue.name,
      email: formValue.email,
      gender: genderValue,
      birthDate: formValue.birthDate,
      acceptedPromotions: !!formValue.acceptedPromotions,
      acceptedAt: new Date().toISOString().split('T')[0]
    };

    if (phoneClean) {
      payload.phone = phoneClean;
    }

    if (!this.tenantId) {
      console.error('Tenant ID no está disponible.');
      this.errorMessage = 'Error: No se pudo identificar el negocio para el registro.';
      this.isLoading = false;
      return;
    }

    this.tenantCustomerService.createCustomer(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Registro exitoso! Revisa tu correo para ver nuestras promociones.';
        this.customerForm.reset();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Hubo un error en el registro. Por favor, inténtalo de nuevo.';
        console.error('Error al crear el cliente:', error);
      }
    });
  }

  // Routing and page scrolling
  scrollToSection(selector: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.showMobileMenu = false;
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'hotel-bg');
  }
}
