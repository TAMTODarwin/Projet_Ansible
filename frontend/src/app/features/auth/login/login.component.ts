import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-brand">
          <mat-icon class="brand-icon">receipt_long</mat-icon>
          <h1>FacturePro</h1>
          <p>Gérez vos factures professionnellement</p>
        </div>
        <div class="auth-features">
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Création de factures en quelques clics</span>
          </div>
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Suivi des paiements en temps réel</span>
          </div>
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Export PDF professionnel</span>
          </div>
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Tableau de bord analytique</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <mat-card class="auth-card">
          <mat-card-header>
            <mat-card-title>Connexion</mat-card-title>
            <mat-card-subtitle>Accédez à votre espace de gestion</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="votre@email.com">
                <mat-icon matPrefix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">L'email est obligatoire</mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Format d'email invalide</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Le mot de passe est obligatoire</mat-error>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                [disabled]="loading || loginForm.invalid">
                <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                <span *ngIf="!loading">Se connecter</span>
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <p class="auth-link">
              Pas encore de compte ?
              <a routerLink="/auth/register">Créer un compte</a>
            </p>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      min-height: 100vh;
    }

    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 60px;
      color: white;

      @media (max-width: 768px) { display: none; }
    }

    .auth-brand {
      margin-bottom: 48px;

      .brand-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin-bottom: 16px;
      }

      h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 8px;
      }

      p {
        font-size: 1.1rem;
        opacity: 0.85;
        margin: 0;
      }
    }

    .auth-features {
      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        font-size: 1rem;

        mat-icon {
          color: #93c5fd;
        }
      }
    }

    .auth-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: #f8fafc;

      @media (max-width: 768px) {
        width: 100%;
        padding: 24px;
      }
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 8px;
      border-radius: 16px !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;

      mat-card-title {
        font-size: 1.8rem !important;
        font-weight: 700 !important;
        color: #1e293b;
      }

      mat-card-subtitle {
        font-size: 0.95rem !important;
        color: #64748b;
        margin-bottom: 24px;
      }
    }

    .full-width { width: 100%; }

    .submit-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      margin-top: 8px;
      border-radius: 8px !important;
    }

    .auth-link {
      text-align: center;
      color: #64748b;
      font-size: 0.9rem;

      a {
        color: #2563eb;
        font-weight: 600;
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.notification.success('Connexion réussie !');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(err.error?.message || 'Email ou mot de passe incorrect');
      }
    });
  }
}
