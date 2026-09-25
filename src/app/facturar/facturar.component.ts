import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-facturar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './facturar.component.html',
  styleUrls: ['./facturar.component.scss']
})
export class FacturarComponent implements OnInit {
  orderId = '';
  order: any = null;
  loading = true;
  error = '';

  submitting = false;
  submitError = '';
  invoice: any = null;

  form: FormGroup;

  readonly regimenOptions = [
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '612 - Personas Físicas con Actividades Empresariales', value: '612' },
    { label: '626 - Régimen Simplificado de Confianza', value: '626' },
    { label: '616 - Sin obligaciones fiscales', value: '616' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      rfc: ['', Validators.required],
      razonSocial: ['', Validators.required],
      regimen: ['616', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    this.loadOrder();
  }

  loadOrder(): void {
    if (!this.orderId) {
      this.error = 'Orden no válida.';
      this.loading = false;
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/tenant-client-orders/${this.orderId}`).subscribe({
      next: (resp) => {
        this.order = resp?.object ?? resp;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se encontró la orden.';
        this.loading = false;
      }
    });
  }

  get total(): number {
    return Number(this.order?.total ?? this.order?.totalFinal ?? this.order?.subtotal ?? 0);
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  }

  private paymentForm(): string {
    switch ((this.order?.paidMethod || '').toUpperCase()) {
      case 'CARD': return '04';
      case 'TRANSFER': return '03';
      case 'CASH': return '01';
      default: return '99';
    }
  }

  submit(): void {
    if (this.form.invalid || !this.order) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const items = (this.order?.items || []).map((i: any) => ({
      quantity: i.cantidad || 1,
      description: i.productName || i.prod || ('Producto ' + (i.productId ?? '')),
      price: i.precioUnitario ?? i.precio ?? 0
    }));

    const payload = {
      customer: {
        legalName: this.form.value.razonSocial,
        taxId: this.form.value.rfc,
        taxSystem: this.form.value.regimen,
        email: this.form.value.email
      },
      items,
      paymentForm: this.paymentForm(),
      use: 'G03',
      currency: 'MXN',
      externalId: this.orderId
    };

    this.http.post<any>(`${environment.apiUrl}/facturapi/invoices`, payload).subscribe({
      next: (inv) => {
        this.invoice = inv;
        this.submitting = false;
      },
      error: (err) => {
        this.submitError = err?.error?.message || 'No se pudo generar la factura. Intenta más tarde.';
        this.submitting = false;
      }
    });
  }

  downloadPdf(): void {
    if (!this.invoice?.id) return;
    window.open(`${environment.apiUrl}/facturapi/invoices/${this.invoice.id}/pdf`, '_blank');
  }
}
