import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-brand">
          <mat-icon class="brand-icon">receipt_long</mat-icon>
          <h1>FacturePro</h1>
          <p>Créez votre compte gratuitement</p>
        </div>
        <div class="auth-features">
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Gestion complète de vos clients</span>
          </div>
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Facturation automatisée</span>
          </div>
          <div class="feature-item">
            <mat-icon>check_circle</mat-icon>
            <span>Rapports et statistiques avancés</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <mat-card class="auth-card">
          <mat-card-header>
            <mat-card-title>Créer un compte</mat-card-title>
            <mat-card-subtitle>Rejoignez FacturePro aujourd'hui</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="firstName" placeholder="Jean">
                  <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">Obligatoire</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="lastName" placeholder="Dupont">
                  <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">Obligatoire</mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="votre@email.com">
                <mat-icon matPrefix>email</mat-icon>
                <mat-error *ngIf="registerForm.get('email')?.hasError('required')">L'email est obligatoire</mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Format invalide</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="phone" placeholder="06 12 34 56 78">
                <mat-icon matPrefix>phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Entreprise (optionnel)</mat-label>
                  <input matInput formControlName="company" placeholder="Ma Société">
                  <mat-icon matPrefix>business</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Statut de l'entreprise</mat-label>
                  <mat-select formControlName="companyType">
                    <mat-option value="NONE">Particulier</mat-option>
                    <mat-option value="MICRO">Micro-entreprise (Auto-entrepreneur)</mat-option>
                    <mat-option value="SASU">SASU / SAS</mat-option>
                    <mat-option value="SARL">EURL / SARL</mat-option>
                    <mat-option value="OTHER">Autre</mat-option>
                  </mat-select>
                  <mat-icon matPrefix>work</mat-icon>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>N° SIRET</mat-label>
                    <input matInput formControlName="siret" placeholder="123 456 789 00012">
                    <mat-icon matPrefix>badge</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>N° RCS</mat-label>
                    <input matInput formControlName="rcs" placeholder="Paris B 123 456 789">
                    <mat-icon matPrefix>article</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Code postal</mat-label>
                    <input matInput formControlName="zipCode" placeholder="75001">
                    <mat-icon matPrefix>pin_drop</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Ville</mat-label>
                    <input matInput formControlName="city" placeholder="Paris">
                    <mat-icon matPrefix>location_city</mat-icon>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Adresse de facturation (N°, Rue, etc.)</mat-label>
                  <textarea matInput formControlName="address" rows="2" placeholder="Votre adresse complète"></textarea>
                  <mat-icon matPrefix>place</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Méthode de paiement</mat-label>
                  <mat-select formControlName="paymentMethod" (selectionChange)="onPaymentMethodChange()">
                    <mat-option value="ESPECE">Espèce</mat-option>
                    <mat-option value="VIREMENT">Virement bancaire</mat-option>
                  </mat-select>
                  <mat-icon matPrefix>payment</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width" *ngIf="showIbanField">
                  <mat-label>IBAN (Coordonnées bancaires)</mat-label>
                  <input matInput formControlName="iban" placeholder="FR76 ...">
                  <mat-icon matPrefix>account_balance</mat-icon>
                </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Le mot de passe est obligatoire</mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">Minimum 6 caractères</mat-error>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                [disabled]="loading || registerForm.invalid">
                <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                <span *ngIf="!loading">Créer mon compte</span>
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <p class="auth-link">
              Déjà un compte ?
              <a routerLink="/auth/login">Se connecter</a>
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

        mat-icon { color: #93c5fd; }
      }
    }

    .auth-right {
      width: 520px;
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
      max-width: 440px;
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

    .form-row {
      display: flex;
      gap: 12px;
    }

    .full-width { width: 100%; }

    .half-width { flex: 1; }

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
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  showIbanField = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
      companyType: ['NONE'],
      siret: [''],
      rcs: [''],
      address: [''],
      zipCode: [''],
      city: [''],
      paymentMethod: ['ESPECE'],
      iban: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onPaymentMethodChange(): void {
    const paymentMethod = this.registerForm.get('paymentMethod')?.value;
    this.showIbanField = paymentMethod === 'VIREMENT';
    if (!this.showIbanField) {
      this.registerForm.get('iban')?.setValue('');
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    
    // Format payment info before sending to API
    const formValue = { ...this.registerForm.value };
    if (formValue.paymentMethod === 'VIREMENT' && formValue.iban) {
        formValue.paymentMethod = `Virement bancaire - IBAN: ${formValue.iban}`;
    } else {
        formValue.paymentMethod = 'Espèce';
    }
    
    // Cleanup temporary payload fields
    delete formValue.iban;

    this.loading = true;
    this.authService.register(formValue).subscribe({
      next: () => {
         this.notification.success('Compte créé avec succès !');
         this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(err.error?.message || 'Erreur lors de la création du compte');
      }
    });
  }
}
