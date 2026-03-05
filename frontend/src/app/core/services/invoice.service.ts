import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { PageResponse } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;
  private cache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  getInvoices(page = 0, size = 10, search?: string, status?: InvoiceStatus): Observable<PageResponse<Invoice>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Invoice>>(this.apiUrl, { params });
  }

  getInvoiceById(id: number): Observable<Invoice> {
    const key = `invoice_${id}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.http.get<Invoice>(`${this.apiUrl}/${id}`).pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  invalidateInvoice(id: number): void {
    this.cache.delete(`invoice_${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice).pipe(
      tap(() => this.cache.clear())
    );
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, invoice).pipe(
      tap(() => this.invalidateInvoice(id))
    );
  }

  updateStatus(id: number, status: InvoiceStatus): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      tap(() => this.invalidateInvoice(id))
    );
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateInvoice(id))
    );
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
