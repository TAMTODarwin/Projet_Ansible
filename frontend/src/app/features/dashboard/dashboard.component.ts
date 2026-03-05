import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats, RecentInvoice } from '../../core/models/invoice.model';
import { AuthService } from '../../core/services/auth.service';
import {
  Chart,
  CategoryScale, LinearScale, BarElement, BarController,
  DoughnutController, ArcElement, Tooltip, Legend, Title
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, BarController,
  DoughnutController, ArcElement, Tooltip, Legend, Title);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, CurrencyPipe, DecimalPipe,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatProgressSpinnerModule, MatChipsModule, BaseChartDirective
  ],
  template: `
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>Bienvenue, {{ authService.currentUser()?.firstName }} ! Voici un aperçu de votre activité.</p>
        </div>
        <div class="header-actions">
          <a mat-raised-button color="primary" routerLink="/invoices/new">
            <mat-icon>add</mat-icon>
            Nouvelle facture
          </a>
        </div>
      </div>

      <div *ngIf="loading" class="loading-center">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <ng-container *ngIf="stats && !loading">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card revenue">
            <div class="stat-icon-bg blue">
              <mat-icon>euro_symbol</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">Chiffre d'affaires</span>
              <span class="stat-value">{{ stats.totalRevenue | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              <span class="stat-sub green">{{ stats.paidCount }} factures payées</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <div class="stat-icon-bg orange">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">En attente</span>
              <span class="stat-value">{{ stats.pendingAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              <span class="stat-sub orange">{{ stats.sentCount }} factures envoyées</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <div class="stat-icon-bg red">
              <mat-icon>warning_amber</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">En retard</span>
              <span class="stat-value">{{ stats.overdueAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              <span class="stat-sub red">{{ stats.overdueCount }} factures échues</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <div class="stat-icon-bg purple">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-label">Clients</span>
              <span class="stat-value">{{ stats.totalClients }}</span>
              <span class="stat-sub gray">{{ stats.totalInvoices }} factures au total</span>
            </div>
          </mat-card>
        </div>

        <!-- Status Pills -->
        <div class="status-pills">
          <div class="pill draft">
            <mat-icon>edit_note</mat-icon>
            <span>{{ stats.draftCount }} Brouillons</span>
          </div>
          <div class="pill sent">
            <mat-icon>send</mat-icon>
            <span>{{ stats.sentCount }} Envoyées</span>
          </div>
          <div class="pill paid">
            <mat-icon>check_circle</mat-icon>
            <span>{{ stats.paidCount }} Payées</span>
          </div>
          <div class="pill overdue">
            <mat-icon>schedule</mat-icon>
            <span>{{ stats.overdueCount }} En retard</span>
          </div>
          <div class="pill cancelled">
            <mat-icon>cancel</mat-icon>
            <span>{{ stats.cancelledCount }} Annulées</span>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Bar Chart: Monthly Revenue -->
          <mat-card class="chart-card large">
            <mat-card-header>
              <mat-card-title>Revenus mensuels (12 derniers mois)</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="barChartData"
                [options]="barChartOptions"
                type="bar">
              </canvas>
            </mat-card-content>
          </mat-card>

          <!-- Doughnut Chart: Status breakdown -->
          <mat-card class="chart-card small">
            <mat-card-header>
              <mat-card-title>Répartition par statut</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="doughnutChartData"
                [options]="doughnutChartOptions"
                type="doughnut">
              </canvas>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Invoices -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-card-title>Factures récentes</mat-card-title>
            <div class="card-header-action">
              <a mat-button routerLink="/invoices">Voir toutes</a>
            </div>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="stats.recentInvoices" class="recent-table">
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>N° Facture</th>
                <td mat-cell *matCellDef="let inv">
                  <a [routerLink]="['/invoices', inv.id]" class="invoice-link">{{ inv.invoiceNumber }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="clientName">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let inv">{{ inv.clientName }}</td>
              </ng-container>

              <ng-container matColumnDef="issueDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let inv">{{ formatDate(inv.issueDate) }}</td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Montant</th>
                <td mat-cell *matCellDef="let inv">
                  <strong>{{ inv.total | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let inv">
                  <span [class]="'status-badge ' + inv.status.toLowerCase()">
                    {{ getStatusLabel(inv.status) }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="stats.recentInvoices.length === 0" class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>Aucune facture pour l'instant</p>
              <a mat-raised-button color="primary" routerLink="/invoices/new">Créer votre première facture</a>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;

      h1 {
        font-size: 1.9rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }

      p {
        color: #64748b;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 80px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;

      @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px !important;
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid transparent;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
      }

      .stat-icon-bg {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon { color: white; font-size: 26px; width: 26px; height: 26px; }

        &.blue { background: linear-gradient(135deg, #2563eb, #3b82f6); }
        &.orange { background: linear-gradient(135deg, #d97706, #f59e0b); }
        &.red { background: linear-gradient(135deg, #dc2626, #ef4444); }
        &.purple { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
      }

      .stat-content {
        display: flex;
        flex-direction: column;

        .stat-label {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          margin: 4px 0;
        }

        .stat-sub {
          font-size: 0.78rem;
          font-weight: 500;

          &.green { color: #16a34a; }
          &.orange { color: #d97706; }
          &.red { color: #dc2626; }
          &.gray { color: #64748b; }
        }
      }
    }

    .status-pills {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;

      .pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 50px;
        font-size: 0.85rem;
        font-weight: 600;

        mat-icon { font-size: 16px; width: 16px; height: 16px; }

        &.draft { background: #f1f5f9; color: #475569; }
        &.sent { background: #eff6ff; color: #2563eb; }
        &.paid { background: #f0fdf4; color: #16a34a; }
        &.overdue { background: #fef2f2; color: #dc2626; }
        &.cancelled { background: #f9fafb; color: #6b7280; }
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;

      @media (max-width: 1024px) { grid-template-columns: 1fr; }
    }

    .chart-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      padding: 8px;

      mat-card-title {
        font-size: 1rem !important;
        font-weight: 600 !important;
        color: #1e293b;
      }
    }

    .recent-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      padding: 8px;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        mat-card-title {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: #1e293b;
        }

        .card-header-action { margin-left: auto; }
      }
    }

    .recent-table {
      width: 100%;

      th.mat-header-cell {
        color: #64748b;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 2px solid #e2e8f0;
      }

      td.mat-cell {
        color: #374151;
        font-size: 0.9rem;
        padding: 14px 16px;
        border-bottom: 1px solid #f1f5f9;
      }
    }

    .invoice-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;

      &:hover { text-decoration: underline; }
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #94a3b8;

      mat-icon { font-size: 56px; width: 56px; height: 56px; margin-bottom: 16px; }
      p { font-size: 1rem; margin-bottom: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  displayedColumns = ['invoiceNumber', 'clientName', 'issueDate', 'total', 'status'];

  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(2)} €` } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => `${value} €` },
        grid: { color: '#f1f5f9' }
      },
      x: { grid: { display: false } }
    }
  };

  doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.buildCharts(stats);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildCharts(stats: DashboardStats): void {
    // Bar chart
    this.barChartData = {
      labels: stats.monthlyRevenue.map(m => m.month),
      datasets: [{
        data: stats.monthlyRevenue.map(m => m.amount),
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(37, 99, 235, 0.25)'
      }]
    };

    // Doughnut chart
    const labels = Object.keys(stats.statusBreakdown).map(s => this.getStatusLabel(s));
    const data = Object.values(stats.statusBreakdown);
    this.doughnutChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#9ca3af'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8
      }]
    };
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon', SENT: 'Envoyée', PAID: 'Payée',
      OVERDUE: 'En retard', CANCELLED: 'Annulée'
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
}
