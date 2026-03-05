import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ClientService } from '../../../core/services/client.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button routerLink="/clients" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>{{ isEditMode ? 'Modifier le client' : 'Nouveau client' }}</h1>
          <p>{{ isEditMode ? 'Mettez à jour les informations du client' : 'Remplissez les informations du nouveau client' }}</p>
        </div>
      </div>

      <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
        <div class="form-layout">
          <!-- Main Info Card -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Informations principales</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Nom complet *</mat-label>
                  <input matInput formControlName="name" placeholder="Jean Dupont">
                  <mat-icon matPrefix>person</mat-icon>
                  <mat-error *ngIf="clientForm.get('name')?.hasError('required')">Obligatoire</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Entreprise</mat-label>
                  <input matInput formControlName="company" placeholder="Ma Société SARL">
                  <mat-icon matPrefix>business</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Email *</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="contact@exemple.com">
                  <mat-icon matPrefix>email</mat-icon>
                  <mat-error *ngIf="clientForm.get('email')?.hasError('required')">Obligatoire</mat-error>
                  <mat-error *ngIf="clientForm.get('email')?.hasError('email')">Format invalide</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Téléphone</mat-label>
                  <input matInput formControlName="phone" placeholder="06 12 34 56 78">
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Address Card -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Adresse</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Adresse</mat-label>
                <input matInput formControlName="address" placeholder="1 rue de la Paix">
                <mat-icon matPrefix>location_on</mat-icon>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline" style="width: 140px;">
                  <mat-label>Code postal</mat-label>
                  <input matInput formControlName="postalCode" placeholder="75001">
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Ville</mat-label>
                  <input matInput formControlName="city" placeholder="Paris">
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>Pays</mat-label>
                  <input matInput formControlName="country" placeholder="France">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Fiscal Info Card -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Informations fiscales</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>SIRET</mat-label>
                  <input matInput formControlName="siret" placeholder="12345678901234">
                  <mat-icon matPrefix>badge</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-field">
                  <mat-label>N° TVA Intracommunautaire</mat-label>
                  <input matInput formControlName="tvaNumber" placeholder="FR12345678901">
                  <mat-icon matPrefix>receipt</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notes internes</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Informations supplémentaires..."></textarea>
                <mat-icon matPrefix>notes</mat-icon>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/clients">
            <mat-icon>close</mat-icon>
            Annuler
          </button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || clientForm.invalid">
            <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
            <mat-icon *ngIf="!loading">save</mat-icon>
            <span>{{ loading ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer le client') }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;

      .back-btn { color: #64748b; }

      h1 { font-size: 1.7rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
      p { color: #64748b; margin: 0; font-size: 0.92rem; }
    }

    .form-layout { display: flex; flex-direction: column; gap: 20px; }

    .form-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;

      mat-card-title {
        font-size: 1rem !important;
        font-weight: 600 !important;
        color: #1e293b;
      }

      mat-card-content { padding-top: 20px !important; }
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .flex-field { flex: 1; min-width: 200px; }

    .full-width { width: 100%; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-bottom: 40px;

      button {
        height: 44px;
        padding: 0 24px;
        font-weight: 600;
        border-radius: 8px !important;

        mat-icon { margin-right: 6px; }
      }
    }
  `]
})
export class ClientFormComponent implements OnInit {
  clientForm!: FormGroup;
  isEditMode = false;
  clientId?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
      address: [''],
      postalCode: [''],
      city: [''],
      country: [''],
      siret: [''],
      tvaNumber: [''],
      notes: ['']
    });

    this.clientId = Number(this.route.snapshot.params['id']);
    if (this.clientId) {
      this.isEditMode = true;
      this.loadClient();
    }
  }

  loadClient(): void {
    this.clientService.getClientById(this.clientId!).subscribe({
      next: (client) => this.clientForm.patchValue(client),
      error: () => {
        this.notification.error('Client introuvable');
        this.router.navigate(['/clients']);
      }
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) return;

    this.loading = true;
    const data = this.clientForm.value;

    const request = this.isEditMode
      ? this.clientService.updateClient(this.clientId!, data)
      : this.clientService.createClient(data);

    request.subscribe({
      next: () => {
        this.notification.success(this.isEditMode ? 'Client mis à jour !' : 'Client créé avec succès !');
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(err.error?.message || 'Une erreur est survenue');
      }
    });
  }
}
