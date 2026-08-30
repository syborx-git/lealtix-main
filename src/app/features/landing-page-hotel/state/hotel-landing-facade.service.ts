import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TenantLandingPageService } from '../../../services/tenant-landing-page.service';
import { ProductsMenuService } from '../../../services/products-menu.service';
import { TenantCustomerService } from '../../../services/tenant-customer.service';

@Injectable({
  providedIn: 'root'
})
export class HotelLandingFacadeService {
  private _tenantId = signal<number>(0);
  private _navBarData = signal<any>({ logoUrl: '', bussinessName: '', since: '' });
  private _aboutData = signal<any>({ since: '', story: '', vision: '' });
  private _footerData = signal<any>({
    dir: '', tel: '', bussinesEmail: '', twiter: '', facebook: '', linkedin: '', instagram: '', tiktok: '', schelules: ''
  });
  private _menuCategorias = signal<any[]>([]);
  private _selectedCategory = signal<string>('Todos');
  private _promotions = signal<any[]>([]);
  private _hasPromotions = signal<boolean>(false);
  private _isLoadingForm = signal<boolean>(false);
  private _formSuccessMessage = signal<string | null>(null);
  private _formErrorMessage = signal<string | null>(null);

  // Selectores de solo lectura
  public readonly tenantId = computed(() => this._tenantId());
  public readonly navBarData = computed(() => this._navBarData());
  public readonly aboutData = computed(() => this._aboutData());
  public readonly footerData = computed(() => this._footerData());
  public readonly menuCategorias = computed(() => this._menuCategorias());
  public readonly selectedCategory = computed(() => this._selectedCategory());
  public readonly promotions = computed(() => this._promotions());
  public readonly hasPromotions = computed(() => this._hasPromotions());
  public readonly isLoadingForm = computed(() => this._isLoadingForm());
  public readonly formSuccessMessage = computed(() => this._formSuccessMessage());
  public readonly formErrorMessage = computed(() => this._formErrorMessage());

  public readonly categoryNames = computed(() => {
    const cats = this._menuCategorias();
    const uniqueNames = [...new Set(cats.map((cat) => cat.nombre))];
    return ['Todos', ...uniqueNames];
  });

  public readonly filteredProducts = computed(() => {
    const selected = this._selectedCategory();
    const cats = this._menuCategorias();

    if (selected === 'Todos') {
      const list: any[] = [];
      cats.forEach((cat) => {
        cat.productos.forEach((p: any) => {
          list.push({ ...p, categoriaName: cat.nombre });
        });
      });
      return list;
    }

    const match = cats.find((cat) => cat.nombre === selected);
    if (!match) return [];
    return match.productos.map((p: any) => ({ ...p, categoriaName: match.nombre }));
  });

  constructor(
    private router: Router,
    private tenantLandingPageService: TenantLandingPageService,
    private productsMenuService: ProductsMenuService,
    private tenantCustomerService: TenantCustomerService
  ) {}

  public loadSlug(slug: string | null): void {
    if (slug === 'demo') {
      this.loadDummyData();
    } else if (slug) {
      this.loadTenantData(slug);
    }
  }

  public selectCategory(catName: string): void {
    this._selectedCategory.set(catName);
  }

  private loadTenantData(slug: string): void {
    this.tenantLandingPageService.getDatosPorSlug(slug).subscribe({
      next: (data: any) => {
        const tId = data.object?.tenant?.id || 0;
        this._tenantId.set(tId);
        const tenantObj = data.object?.tenant || {};

        this._navBarData.set({
          logoUrl: tenantObj.logoUrl || '',
          bussinessName: tenantObj.bussinessName || tenantObj.nombreNegocio || tenantObj.nombre || '',
          since: tenantObj.slogan || ''
        });

        this._aboutData.set({
          since: tenantObj.slogan || '',
          story: data.object?.tenantConfig?.history || '',
          vision: data.object?.tenantConfig?.vision || ''
        });

        const tc = data.object?.tenantConfig || {};
        const sanitize = (v: any) => (v ? String(v).trim() : '');

        this._footerData.set({
          dir: tenantObj.direccion || '',
          tel: tenantObj.telefono || '',
          bussinesEmail: data.object?.user?.email || '',
          twiter: sanitize(tc.twitter),
          facebook: sanitize(tc.facebook),
          linkedin: sanitize(tc.linkedin),
          instagram: sanitize(tc.instagram),
          tiktok: sanitize(tc.tiktok),
          schelules: tenantObj.schedules || ''
        });

        if (tId > 0) {
          this.loadProducts(tId);
          this.loadPromotions(tId);
        }
      },
      error: (err: any) => {
        console.error('Error al cargar datos del hotel:', err);
        this.router.navigate(['/error']);
      }
    });
  }

  private loadProducts(tenantId: number): void {
    this.productsMenuService.getProductsByTenantId(tenantId).subscribe({
      next: (data: any) => {
        const raw = data.object || [];
        const categoriasMap: { [key: string]: any } = {};

        raw.forEach((p: any) => {
          if (p && (p.isActive === false || p.categoryIsActive === false)) return;
          const catName = p.categoryName || 'Sin categoría';
          if (!categoriasMap[catName]) {
            categoriasMap[catName] = { nombre: catName, productos: [] };
          }
          categoriasMap[catName].productos.push({
            precio: p.price != null ? `$${p.price}` : '$0',
            img: p.imageUrl ? p.imageUrl.replace('/upload/', '/upload/w_400,h_250,c_limit,f_auto,q_auto/') : '',
            prod: p.name || '',
            descProd: p.description || ''
          });
        });

        const list = Object.keys(categoriasMap).map((k) => categoriasMap[k]);
        this._menuCategorias.set(list);
      },
      error: (err: any) => console.warn('Error al cargar productos:', err)
    });
  }

  private loadPromotions(tenantId: number): void {
    this.tenantLandingPageService.getActivePromotions(tenantId).subscribe({
      next: (response: any) => {
        const rawPromos: any[] = Array.isArray(response) ? response : (response?.object || []);
        const promos = rawPromos.map((p: any, idx: number) => ({
          title: p.title || '',
          description: p.promotionReward?.description || p.description || '',
          imageUrl: p.imageUrl || '',
          tag: idx === 0 ? '-20% Descuento' : idx === 1 ? 'Happy Hour' : 'Exclusivo',
          startDate: p.startDate,
          endDate: p.endDate
        }));
        this._promotions.set(promos);
        this._hasPromotions.set(promos.length > 0);
      },
      error: () => {
        this._hasPromotions.set(false);
        this._promotions.set([]);
      }
    });
  }

  private loadDummyData(): void {
    this._navBarData.set({
      logoUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtW840kFN-codoyT1BMRgiHI8dqkjzzKDEmL6dqWfT2KDgzJRdc696s5GsHVshSWVKnqkSXfUS98Fj_J37TQYIrN9QZVsFfK5W_YCtsVAkT_rDkcAZrSHl3Q2vFPiF7_pUp71cFzehk8wnMk8x9onjMNahc-D3dQ8uFaAI83_KUCiz_3xt6Mhfj9Jw1AqXsq-Oc30IRNTGRsDuUooWQFgKCQQFLL7mu2ysxqZi0epSY3I6-97KaBf3we3M',
      bussinessName: 'Aurora Grand Hotel',
      since: 'Cada estancia merece una recompensa.'
    });

    this._aboutData.set({
      since: 'Desde 1990',
      story: 'Aurora Grand es más que un destino; es una experiencia de serenidad y exclusividad.',
      vision: 'Ser el hotel boutique predilecto a nivel nacional, combinando confort contemporáneo con una oferta gastronómica excepcional.'
    });

    this._footerData.set({
      dir: 'Av. Paseo de la Reforma 250, Juárez, Ciudad de México',
      tel: '+52 55 5000 6000',
      bussinesEmail: 'concierge@auroragrand.com',
      twiter: '#x',
      facebook: '#fb',
      linkedin: '#in',
      instagram: '#in',
      tiktok: '#tt',
      schelules: 'Recepción 24/7\nRestaurante: 7:00 a 23:00 Hrs.\nRoom Service: 24/7'
    });

    this._promotions.set([
      {
        title: 'Desayunos Inolvidables',
        description: 'Reserve con anticipación y disfrute de un descuento especial en nuestro menú de desayunos a la carta.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmk_m3FVMJhdp45BNsUqH_odyZdZ0zbsXnHYHC3WN2LMTP3PSerd7WvoBulxThMqhYzbN6ywca7vnyZ03B7I0rat1OuktCBnUi5rspKOqMsWuHwWwEP9trF1wE7mzEzUcnyv5J4poqkirS83xs7RHP_fTAPTwgXrA43vKGV2G7_QjBHwUSzpNOkBmLwQxHW8teW_qtqDOysy5TkmT0mKQZ63hYTGmppWQ4JkOU8zWeynLNkABH-WlX',
        tag: '-20% Descuento',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Lobby Bar Sessions',
        description: '2x1 en coctelería de autor todos los días de 18:00 a 20:00 hrs.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4ltEBBzBlbkulIW9uovEyijDhSFZuW2M4AvBsV3f_dEUZ9kCM7-opMMWPGHImlbzJtphaeExZ42hkqHOSWYXqFlrZ0znrbPU-yGmni1-N9gWIGbRSCdd6dr-hLgMhQiZ7h5j4daGdeouFimyeBimtCJQWUKf7C3l6_sdWR-ZQW7XcByyOMR7oqn6-wXJUkS_suFBEtednPMpA1MpLzy3LisNDDDyUBdtOQMv0um-eVhtVI9Fut_OP',
        tag: 'Happy Hour',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
    this._hasPromotions.set(true);

    this._menuCategorias.set([
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
      }
    ]);
  }

  public submitCustomerForm(formValue: any, onSuccess: () => void): void {
    const tId = this._tenantId();
    if (!tId && this.router.url.includes('/demo')) {
      this._formSuccessMessage.set('¡Registro de demostración completado exitosamente! 🎉');
      onSuccess();
      return;
    }

    if (!tId) {
      this._formErrorMessage.set('No se pudo identificar el hotel para registrar la membresía.');
      return;
    }

    this._isLoadingForm.set(true);
    this._formSuccessMessage.set(null);
    this._formErrorMessage.set(null);

    const payload: any = {
      tenantId: tId,
      name: formValue.name,
      email: formValue.email,
      gender: formValue.gender ? String(formValue.gender).toLowerCase() : undefined,
      birthDate: formValue.birthDate,
      acceptedPromotions: !!formValue.acceptedPromotions,
      acceptedAt: new Date().toISOString().split('T')[0]
    };

    if (formValue.phone) {
      payload.phone = String(formValue.phone).replace(/\D+/g, '');
    }

    this.tenantCustomerService.createCustomer(payload).subscribe({
      next: () => {
        this._isLoadingForm.set(false);
        this._formSuccessMessage.set('¡Registro exitoso! Revisa tu correo para ver tus beneficios de bienvenida.');
        onSuccess();
      },
      error: (err: any) => {
        this._isLoadingForm.set(false);
        this._formErrorMessage.set(err?.error?.message || 'Hubo un error en el registro. Por favor, inténtalo de nuevo.');
      }
    });
  }
}
