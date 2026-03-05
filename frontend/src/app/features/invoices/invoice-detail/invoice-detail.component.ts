import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, CurrencyPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule, MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <!-- Toolbar -->
      <div class="page-header">
        <div>
          <a routerLink="/invoices" class="back-link">
            <mat-icon>arrow_back</mat-icon> Retour aux factures
          </a>
          <div class="title-row" *ngIf="invoice">
            <h1>{{ invoice.invoiceNumber }}</h1>
            <span [class]="'status-badge ' + invoice.status?.toLowerCase()">
              {{ getStatusLabel(invoice.status) }}
            </span>
          </div>
        </div>

        <div class="action-buttons" *ngIf="invoice">
          <!-- Status actions -->
          <button mat-stroked-button *ngIf="invoice.status === 'DRAFT'" (click)="changeStatus('SENT')">
            <mat-icon>send</mat-icon>
            Marquer comme envoyée
          </button>
          <button mat-stroked-button color="primary" *ngIf="invoice.status === 'SENT' || invoice.status === 'OVERDUE'" (click)="changeStatus('PAID')">
            <mat-icon>check_circle</mat-icon>
            Marquer comme payée
          </button>
          <button mat-stroked-button color="warn" *ngIf="canCancel()" (click)="changeStatus('CANCELLED')">
            <mat-icon>cancel</mat-icon>
            Annuler
          </button>

          <!-- PDF -->
          <button mat-stroked-button (click)="downloadPdf()" [disabled]="downloadingPdf">
            <mat-icon>picture_as_pdf</mat-icon>
            {{ downloadingPdf ? 'Téléchargement...' : 'Télécharger PDF' }}
          </button>

          <!-- Edit -->
          <a *ngIf="canEdit()" mat-raised-button color="primary" [routerLink]="['/invoices', invoice.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Modifier
          </a>

          <!-- More -->
          <button mat-icon-button [matMenuTriggerFor]="moreMenu" matTooltip="Plus d'actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #moreMenu="matMenu">
            <button mat-menu-item (click)="duplicateInvoice()">
              <mat-icon>content_copy</mat-icon>
              Dupliquer
            </button>
            <button mat-menu-item (click)="deleteInvoice()" class="delete-item">
              <mat-icon>delete</mat-icon>
              Supprimer
            </button>
          </mat-menu>
        </div>
      </div>

      <div *ngIf="loading" class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>

      <div *ngIf="!loading && invoice" class="detail-grid">
        <!-- Main -->
        <div class="main-col">

          <!-- Items table card -->
          <mat-card class="invoice-card items-card">
            <mat-card-content>
              <div class="invoice-header-info">
                <!-- Logo placeholder -->
                <div class="brand-info">
                  <div class="brand-logo">FP</div>
                  <span class="brand-name">FacturePro</span>
                </div>
                <div class="inv-meta">
                  <div class="meta-row">
                    <span>Facture N°</span>
                    <strong>{{ invoice.invoiceNumber }}</strong>
                  </div>
                  <div class="meta-row">
                    <span>Date d'émission</span>
                    <strong>{{ formatDate(invoice.issueDate) }}</strong>
                  </div>
                  <div class="meta-row">
                    <span>Date d'échéance</span>
                    <strong [class]="isOverdue() ? 'text-red' : ''">{{ formatDate(invoice.dueDate) }}</strong>
                  </div>
                </div>
              </div>

              <mat-divider style="margin: 20px 0;"></mat-divider>

              <!-- Items table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Unité</th>
                    <th class="text-right">Qté</th>
                    <th class="text-right">Prix HT</th>
                    <th class="text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of invoice.items; let odd = odd" [class.odd-row]="odd">
                    <td>{{ item.description }}</td>
                    <td class="text-muted">{{ item.unit || '—' }}</td>
                    <td class="text-right">{{ item.quantity }}</td>
                    <td class="text-right">{{ item.unitPrice | currency:'EUR':'symbol':'1.2-2':'fr' }}</td>
                    <td class="text-right"><strong>{{ item.total | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals -->
              <div class="totals-block">
                <div class="total-line">
                  <span>Sous-total HT</span>
                  <span>{{ invoice.subtotal | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                </div>
                  <div class="total-line" *ngIf="invoice?.taxRate! > 0">
                    <span>TVA {{ invoice.taxRate }}%</span>
                    <span>{{ invoice.taxAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                  </div>
                  <div class="total-line" *ngIf="invoice?.taxRate === 0">
                    <span>TVA 0%</span>
                    <span>0,00 €</span>
                  </div>
                  <div class="total-line text-muted" *ngIf="invoice?.taxRate === 0" style="font-size: 0.85rem; font-style: italic; width: 100%; justify-content: flex-end; display: flex; margin-bottom: 8px;">
                    <span>TVA non applicable, art. 293 B du CGI</span>
                  </div>
                  <mat-divider style="margin: 8px 0;"></mat-divider>
                  <div class="total-line grand-total">
                    <span>{{ invoice?.taxRate === 0 ? 'Total' : 'Total TTC' }}</span>
                  <strong>{{ invoice.total | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                </div>
              </div>

              <!-- Notes -->
              <div *ngIf="invoice.notes" class="notes-block">
                <h4>Notes</h4>
                <p>{{ invoice.notes }}</p>
              </div>
              <div *ngIf="invoice.termsAndConditions" class="notes-block">
                <h4>Conditions de paiement</h4>
                <p>{{ invoice.termsAndConditions }}</p>
              </div>

            </mat-card-content>
          </mat-card>
        </div>

        <!-- Sidebar -->
        <div class="side-col">

          <!-- Client card -->
          <mat-card class="side-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>person</mat-icon>
              <mat-card-title>Client</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="client-block">
                <div class="client-avatar">{{ getInitials(invoice.clientName) }}</div>
                <div>
                  <div class="client-name">{{ invoice.clientName }}</div>
                  <div class="client-detail" *ngIf="invoice.clientCompany">{{ invoice.clientCompany }}</div>
                  <div class="client-detail" *ngIf="invoice.clientEmail">
                    <mat-icon style="font-size:14px; vertical-align: middle;">email</mat-icon>
                    {{ invoice.clientEmail }}
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Summary card -->
          <mat-card class="side-card summary-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>euro</mat-icon>
              <mat-card-title>Résumé</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-amount">
                {{ invoice.total | currency:'EUR':'symbol':'1.2-2':'fr' }}
              </div>
              <div class="summary-label">Total TTC</div>

              <mat-divider style="margin: 16px 0;"></mat-divider>

              <div class="side-row">
                <span>HT</span>
                <span>{{ invoice.subtotal | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
                <div class="side-row" *ngIf="invoice?.taxRate! > 0">
                  <span>TVA ({{ invoice.taxRate }}%)</span>
                  <span>{{ invoice.taxAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                </div>
                <div class="side-row" *ngIf="invoice?.taxRate === 0">
                  <span>TVA</span>
                  <span class="text-muted">Non applicable</span>
              </div>
              <div class="side-row">
                <span>Lignes</span>
                <span>{{ invoice.items ? invoice.items.length : 0 }}</span>
              </div>
            </mat-card-content>
          </mat-card>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.88rem;
        margin-bottom: 6px;

        mat-icon { font-size: 18px; width: 18px; height: 18px; }
        &:hover { color: #2563eb; }
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 14px;

        h1 { font-size: 1.9rem; font-weight: 700; color: #1e293b; margin: 0; }
      }
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .status-badge {
      padding: 5px 14px;
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;

      &.draft { background: #f1f5f9; color: #475569; }
      &.sent { background: #eff6ff; color: #2563eb; }
      &.paid { background: #f0fdf4; color: #16a34a; }
      &.overdue { background: #fef2f2; color: #dc2626; }
      &.cancelled { background: #f9fafb; color: #6b7280; }
    }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .main-col, .side-col { display: flex; flex-direction: column; gap: 20px; }

    .invoice-card, .side-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
    }

    /* Invoice preview styles */
    .invoice-header-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .brand-logo {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        font-weight: 800;
        font-size: 1rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand-name {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1e293b;
      }
    }

    .inv-meta {
      text-align: right;

      .meta-row {
        display: flex;
        gap: 16px;
        justify-content: flex-end;
        font-size: 0.88rem;
        margin-bottom: 4px;
        color: #475569;

        strong { color: #1e293b; }
        .text-red { color: #dc2626; }
      }
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;

      th {
        background: #f8fafc;
        padding: 10px 14px;
        color: #64748b;
        font-weight: 600;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: left;

        &.text-right { text-align: right; }
      }

      td {
        padding: 12px 14px;
        color: #374151;
        border-bottom: 1px solid #f1f5f9;
      }

      .odd-row { background: #fdfdfe; }
      .text-right { text-align: right; }
      .text-muted { color: #94a3b8; font-size: 0.85rem; }
    }

    .totals-block {
      max-width: 280px;
      margin: 24px 0 0 auto;

      .total-line {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 0.92rem;
        color: #475569;
      }

      .grand-total {
        font-size: 1.1rem;
        color: #1e293b;
        padding-top: 10px;
      }
    }

    .notes-block {
      margin-top: 24px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 10px;

      h4 { font-size: 0.82rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0 0 6px; }
      p { margin: 0; font-size: 0.88rem; color: #475569; line-height: 1.5; }
    }

    /* Sidebar */
    .side-card {
      mat-card-header { padding: 20px 20px 0; margin-bottom: 8px; }
      mat-card-content { padding: 16px 20px 20px !important; }

      mat-icon[mat-card-avatar] {
        background: #eff6ff;
        color: #2563eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        padding: 4px;
      }
    }

    .client-block {
      display: flex;
      gap: 12px;
      align-items: flex-start;

      .client-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #eff6ff;
        color: #2563eb;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
      }

      .client-name { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
      .client-detail { font-size: 0.83rem; color: #64748b; margin-top: 2px; }
    }

    .summary-card {
      .summary-amount {
        font-size: 2rem;
        font-weight: 800;
        color: #2563eb;
        text-align: center;
        padding: 8px 0 2px;
      }
      .summary-label {
        text-align: center;
        color: #94a3b8;
        font-size: 0.82rem;
        margin-bottom: 4px;
      }
    }

    .side-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 0.88rem;
      color: #64748b;
    }

    ::ng-deep .delete-item { color: #dc2626 !important; mat-icon { color: #dc2626 !important; } }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  invoice?: Invoice;
  loading = true;
  downloadingPdf = false;

  constructor(
    private invoiceService: InvoiceService,
    private notification: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (inv) => { this.invoice = inv; this.loading = false; },
      error: () => { this.notification.error('Facture introuvable'); this.loading = false; }
    });
  }

  changeStatus(status: InvoiceStatus): void {
    if (!this.invoice?.id) return;
    this.invoiceService.updateStatus(this.invoice.id, status).subscribe({
      next: (updated) => {
        this.invoice = updated;
        this.notification.success('Statut mis à jour !');
      },
      error: () => this.notification.error('Erreur lors de la mise à jour du statut')
    });
  }

  downloadPdf(): void {
    if (!this.invoice?.id) return;
    this.downloadingPdf = true;
    this.invoiceService.downloadPdf(this.invoice.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.invoice!.invoiceNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingPdf = false;
        this.notification.success('PDF téléchargé !');
      },
      error: () => {
        this.downloadingPdf = false;
        this.notification.error('Erreur lors du téléchargement');
      }
    });
  }

  duplicateInvoice(): void {
    if (!this.invoice?.id) return;
    const dup: Invoice = {
      clientId: this.invoice.clientId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: this.invoice.dueDate,
      taxRate: this.invoice.taxRate,
      notes: this.invoice.notes,
      termsAndConditions: this.invoice.termsAndConditions,
      items: (this.invoice.items || []).map(i => ({
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    };

    this.invoiceService.createInvoice(dup).subscribe({
      next: (inv) => {
        this.notification.success('Facture dupliquée !');
        this.router.navigate(['/invoices', inv.id]);
      },
      error: () => this.notification.error('Erreur lors de la duplication')
    });
  }

  deleteInvoice(): void {
    if (!this.invoice?.id || !confirm('Supprimer cette facture ?')) return;
    this.invoiceService.deleteInvoice(this.invoice.id).subscribe({
      next: () => {
        this.notification.success('Facture supprimée');
        this.router.navigate(['/invoices']);
      },
      error: () => this.notification.error('Erreur lors de la suppression')
    });
  }

  canEdit(): boolean {
    return this.invoice?.status === 'DRAFT' || this.invoice?.status === 'SENT' || this.invoice?.status === 'OVERDUE';
  }

  canCancel(): boolean {
    return this.invoice?.status === 'DRAFT' || this.invoice?.status === 'SENT' || this.invoice?.status === 'OVERDUE';
  }

  isOverdue(): boolean {
    if (this.invoice?.status === 'OVERDUE') return true;
    return this.invoice?.status === 'SENT' && !!this.invoice?.dueDate
      ? new Date(this.invoice.dueDate) < new Date()
      : false;
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

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
