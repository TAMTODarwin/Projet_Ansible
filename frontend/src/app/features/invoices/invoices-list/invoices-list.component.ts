import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, CurrencyPipe,
    MatTableModule, MatPaginatorModule, MatCardModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Factures</h1>
          <p>Créez et gérez toutes vos factures</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/invoices/new">
          <mat-icon>add</mat-icon>
          Nouvelle facture
        </a>
      </div>

      <!-- Filters Card -->
      <mat-card class="table-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher...</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" placeholder="N° facture, client...">
            <mat-icon matPrefix>search</mat-icon>
            <button *ngIf="searchQuery" matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 180px;">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="selectedStatus" (ngModelChange)="onStatusFilter($event)">
              <mat-option [value]="null">Tous</mat-option>
              <mat-option value="DRAFT">Brouillon</mat-option>
              <mat-option value="SENT">Envoyée</mat-option>
              <mat-option value="PAID">Payée</mat-option>
              <mat-option value="OVERDUE">En retard</mat-option>
              <mat-option value="CANCELLED">Annulée</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Table -->
        <div *ngIf="!loading" class="table-wrapper">
          <table mat-table [dataSource]="invoices" class="data-table">

            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>N° Facture</th>
              <td mat-cell *matCellDef="let inv">
                <a [routerLink]="['/invoices', inv.id]" class="invoice-link">{{ inv.invoiceNumber }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let inv">
                <div class="client-info">
                  <span class="client-name">{{ inv.clientName }}</span>
                  <span class="client-company">{{ inv.clientCompany }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="issueDate">
              <th mat-header-cell *matHeaderCellDef>Émission</th>
              <td mat-cell *matCellDef="let inv">{{ formatDate(inv.issueDate) }}</td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Échéance</th>
              <td mat-cell *matCellDef="let inv">
                <span [class]="'due-date ' + (isOverdue(inv) ? 'overdue' : '')">
                  {{ formatDate(inv.dueDate) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Montant TTC</th>
              <td mat-cell *matCellDef="let inv">
                <strong>{{ inv.total | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let inv">
                <span [class]="'status-badge ' + inv.status?.toLowerCase()">
                  {{ getStatusLabel(inv.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let inv">
                <div class="actions-cell">
                  <a mat-icon-button [routerLink]="['/invoices', inv.id]" matTooltip="Voir">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a mat-icon-button [routerLink]="['/invoices', inv.id, 'edit']" matTooltip="Modifier"
                     *ngIf="inv.status === 'DRAFT' || inv.status === 'SENT' || inv.status === 'OVERDUE'">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button mat-icon-button (click)="downloadPdf(inv)" matTooltip="Télécharger PDF">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteInvoice(inv)" matTooltip="Supprimer" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>
          </table>

          <!-- Empty State -->
          <div *ngIf="invoices.length === 0" class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <h3>Aucune facture trouvée</h3>
            <p>{{ searchQuery || selectedStatus ? 'Modifiez vos filtres' : 'Créez votre première facture' }}</p>
            <a *ngIf="!searchQuery && !selectedStatus" mat-raised-button color="primary" routerLink="/invoices/new">
              Créer une facture
            </a>
          </div>

          <!-- Pagination -->
          <div class="pagination-row">
            <span class="total-info">{{ totalElements }} facture{{ totalElements > 1 ? 's' : '' }}</span>
            <mat-paginator
              [length]="totalElements"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;

      h1 { font-size: 1.9rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
      p { color: #64748b; margin: 0; font-size: 0.95rem; }
    }

    .table-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      overflow: hidden;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      padding: 20px 20px 0;
      flex-wrap: wrap;

      .search-field { width: 340px; max-width: 100%; }
    }

    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .data-table {
      width: 100%;

      th.mat-header-cell {
        color: #64748b;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: #f8fafc;
        padding: 14px 16px;
      }

      td.mat-cell {
        padding: 14px 16px;
        color: #374151;
        font-size: 0.9rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .data-row:hover { background: #f8fafc; }
    }

    .invoice-link {
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
      font-family: monospace;
      font-size: 0.92rem;

      &:hover { text-decoration: underline; }
    }

    .client-info {
      display: flex;
      flex-direction: column;

      .client-name { font-weight: 600; color: #1e293b; }
      .client-company { font-size: 0.8rem; color: #94a3b8; }
    }

    .due-date {
      &.overdue { color: #dc2626; font-weight: 600; }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 50px;
      font-size: 0.78rem;
      font-weight: 600;

      &.draft { background: #f1f5f9; color: #475569; }
      &.sent { background: #eff6ff; color: #2563eb; }
      &.paid { background: #f0fdf4; color: #16a34a; }
      &.overdue { background: #fef2f2; color: #dc2626; }
      &.cancelled { background: #f9fafb; color: #6b7280; }
    }

    .actions-cell {
      display: flex;
      gap: 2px;
      justify-content: flex-end;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      color: #94a3b8;

      mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
      h3 { font-size: 1.1rem; color: #64748b; margin: 0 0 8px; }
      p { margin: 0 0 20px; }
    }

    .pagination-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;

      .total-info { color: #64748b; font-size: 0.85rem; }
    }
  `]
})
export class InvoicesListComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = true;
  searchQuery = '';
  selectedStatus: InvoiceStatus | null = null;
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  displayedColumns = ['invoiceNumber', 'client', 'issueDate', 'dueDate', 'total', 'status', 'actions'];

  private searchSubject = new Subject<string>();

  constructor(
    private invoiceService: InvoiceService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadInvoices();
    });
  }

  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices(
      this.currentPage, this.pageSize,
      this.searchQuery || undefined,
      this.selectedStatus || undefined
    ).subscribe({
      next: (page) => {
        this.invoices = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notification.error('Erreur lors du chargement des factures');
      }
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadInvoices();
  }

  onStatusFilter(status: InvoiceStatus | null): void {
    this.currentPage = 0;
    this.loadInvoices();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInvoices();
  }

  downloadPdf(invoice: Invoice): void {
    this.invoiceService.downloadPdf(invoice.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('PDF téléchargé avec succès !');
      },
      error: () => this.notification.error('Erreur lors du téléchargement du PDF')
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (!confirm(`Supprimer la facture "${invoice.invoiceNumber}" ?`)) return;

    this.invoiceService.deleteInvoice(invoice.id!).subscribe({
      next: () => {
        this.notification.success('Facture supprimée avec succès');
        this.loadInvoices();
      },
      error: () => this.notification.error('Erreur lors de la suppression')
    });
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon', SENT: 'Envoyée', PAID: 'Payée',
      OVERDUE: 'En retard', CANCELLED: 'Annulée'
    };
    return status ? (map[status] ?? status) : '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  isOverdue(invoice: Invoice): boolean {
    if (invoice.status === 'OVERDUE') return true;
    return invoice.status === 'SENT' && !!invoice.dueDate
      ? new Date(invoice.dueDate) < new Date()
      : false;
  }
}
