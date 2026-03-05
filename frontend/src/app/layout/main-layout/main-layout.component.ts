import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatListModule, MatTooltipModule, MatMenuModule, MatDividerModule, MatSnackBarModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="sidenav">

        <!-- Brand -->
        <div class="brand">
          <mat-icon class="brand-icon">receipt_long</mat-icon>
          <span class="brand-name">FacturePro</span>
        </div>

        <mat-divider></mat-divider>

        <!-- Navigation -->
        <nav class="nav-section">
          <p class="nav-label">MENU PRINCIPAL</p>
          <a *ngFor="let item of navItems"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <!-- User Section -->
        <div class="sidebar-footer">
          <mat-divider></mat-divider>
          <div class="user-info" [matMenuTriggerFor]="userMenu">
            <div class="user-avatar">
              {{ getUserInitials() }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
              <span class="user-email">{{ authService.currentUser()?.email }}</span>
            </div>
            <mat-icon>expand_more</mat-icon>
          </div>
        </div>

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Se déconnecter</span>
          </button>
        </mat-menu>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content class="main-content">
        <!-- Top Toolbar (mobile) -->
        <mat-toolbar class="top-toolbar" *ngIf="isMobile()">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span>FacturePro</span>
        </mat-toolbar>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 260px;
      background: #1e293b;
      display: flex;
      flex-direction: column;
      border-right: none !important;

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 20px;
        color: white;

        .brand-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #60a5fa;
        }

        .brand-name {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
      }

      mat-divider {
        border-color: rgba(255,255,255,0.1) !important;
      }

      .nav-section {
        flex: 1;
        padding: 16px 12px;

        .nav-label {
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          margin: 8px 8px 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-bottom: 4px;

          mat-icon { font-size: 20px; width: 20px; height: 20px; }

          &:hover {
            background: rgba(255,255,255,0.07);
            color: white;
          }

          &.active {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          }
        }
      }

      .sidebar-footer {
        padding: 12px;

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          color: #94a3b8;
          transition: background 0.2s;

          &:hover { background: rgba(255,255,255,0.07); }

          .user-avatar {
            width: 36px;
            height: 36px;
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

          .user-details {
            flex: 1;
            overflow: hidden;

            .user-name {
              display: block;
              color: white;
              font-size: 0.88rem;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .user-email {
              display: block;
              font-size: 0.75rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }

          mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }
      }
    }

    .main-content {
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
    }

    .top-toolbar {
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;

      @media (max-width: 768px) { padding: 16px; }
    }
  `]
})
export class MainLayoutComponent {
  isMobile = signal(false);

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/dashboard' },
    { icon: 'people', label: 'Clients', route: '/clients' },
    { icon: 'receipt_long', label: 'Factures', route: '/invoices' }
  ];

  constructor(
    public authService: AuthService,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => this.isMobile.set(result.matches));
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
