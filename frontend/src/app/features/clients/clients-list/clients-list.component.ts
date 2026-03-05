import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Client } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';
import { NotificationService } from '../../../core/services/notification.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatPaginatorModule, MatCardModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Clients</h1>
          <p>Gérez vos clients et leurs informations</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/clients/new">
          <mat-icon>person_add</mat-icon>
          Nouveau client
        </a>
      </div>

      <!-- Search & Table Card -->
      <mat-card class="table-card">
        <!-- Search Bar -->
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher un client...</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" placeholder="Nom, email, entreprise...">
            <mat-icon matPrefix>search</mat-icon>
            <button *ngIf="searchQuery" matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Table -->
        <div *ngIf="!loading" class="table-wrapper">
          <table mat-table [dataSource]="clients" class="data-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let client">
                <div class="client-cell">
                  <div class="client-avatar">{{ getInitials(client.name) }}</div>
                  <div>
                    <div class="client-name">{{ client.name }}</div>
                    <div class="client-company">{{ client.company }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let client">{{ client.email }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Téléphone</th>
              <td mat-cell *matCellDef="let client">{{ client.phone || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef>Ville</th>
              <td mat-cell *matCellDef="let client">{{ client.city || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="invoiceCount">
              <th mat-header-cell *matHeaderCellDef>Factures</th>
              <td mat-cell *matCellDef="let client">
                <span class="badge-count">{{ client.invoiceCount || 0 }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let client">
                <div class="actions-cell">
                  <a mat-icon-button [routerLink]="['/clients', client.id, 'edit']" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button mat-icon-button (click)="deleteClient(client)" matTooltip="Supprimer" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>
          </table>

          <!-- Empty State -->
          <div *ngIf="clients.length === 0" class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <h3>Aucun client trouvé</h3>
            <p>{{ searchQuery ? 'Essayez un autre terme de recherche' : 'Ajoutez votre premier client pour commencer' }}</p>
            <a *ngIf="!searchQuery" mat-raised-button color="primary" routerLink="/clients/new">
              Ajouter un client
            </a>
          </div>

          <!-- Pagination -->
          <div class="pagination-row">
            <span class="total-info">{{ totalElements }} client{{ totalElements > 1 ? 's' : '' }}</span>
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
    .page-container { max-width: 1200px; margin: 0 auto; }

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

    .search-bar {
      padding: 20px 20px 0;

      .search-field { width: 380px; max-width: 100%; }
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

    .client-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .client-avatar {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.85rem;
        flex-shrink: 0;
      }

      .client-name { font-weight: 600; color: #1e293b; }
      .client-company { font-size: 0.8rem; color: #94a3b8; }
    }

    .badge-count {
      background: #eff6ff;
      color: #2563eb;
      padding: 3px 10px;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .actions-cell {
      display: flex;
      gap: 4px;
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

      .total-info {
        color: #64748b;
        font-size: 0.85rem;
      }
    }
  `]
})
export class ClientsListComponent implements OnInit {
  clients: Client[] = [];
  loading = true;
  searchQuery = '';
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  displayedColumns = ['name', 'email', 'phone', 'city', 'invoiceCount', 'actions'];

  private searchSubject = new Subject<string>();

  constructor(
    private clientService: ClientService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadClients();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 0;
      this.loadClients();
    });
  }

  loadClients(): void {
    this.loading = true;
    this.clientService.getClients(this.currentPage, this.pageSize, this.searchQuery || undefined).subscribe({
      next: (page) => {
        this.clients = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notification.error('Erreur lors du chargement des clients');
      }
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadClients();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClients();
  }

  deleteClient(client: Client): void {
    if (!confirm(`Supprimer le client "${client.name}" ?`)) return;

    this.clientService.deleteClient(client.id!).subscribe({
      next: () => {
        this.notification.success('Client supprimé avec succès');
        this.loadClients();
      },
      error: () => this.notification.error('Erreur lors de la suppression')
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
