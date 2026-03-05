import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, Validators
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Client } from '../../../core/models/client.model';
import { Invoice, InvoiceItem } from '../../../core/models/invoice.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule, MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/invoices" class="back-link">
            <mat-icon>arrow_back</mat-icon> Retour aux factures
          </a>
          <h1>{{ isEditMode ? 'Modifier la facture' : 'Nouvelle facture' }}</h1>
        </div>
      </div>

      <div *ngIf="loading" class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>

      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <!-- Left col -->
          <div class="left-col">

            <!-- Client & Dates -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>person</mat-icon>
                <mat-card-title>Client & Dates</mat-card-title>
              </mat-card-header>
              <mat-card-content>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Client *</mat-label>
                  <mat-select formControlName="clientId">
                    <mat-option *ngFor="let c of clients" [value]="c.id">
                      {{ c.name }} <span *ngIf="c.company"> — {{ c.company }}</span>
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="form.get('clientId')?.hasError('required')">Client requis</mat-error>
                </mat-form-field>

                <div class="two-col">
                  <mat-form-field appearance="outline">
                    <mat-label>Date d'émission *</mat-label>
                    <input matInput [matDatepicker]="pickerIssue" formControlName="issueDate">
                    <mat-datepicker-toggle matSuffix [for]="pickerIssue"></mat-datepicker-toggle>
                    <mat-datepicker #pickerIssue></mat-datepicker>
                    <mat-error>Date requise</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date d'échéance *</mat-label>
                    <input matInput [matDatepicker]="pickerDue" formControlName="dueDate">
                    <mat-datepicker-toggle matSuffix [for]="pickerDue"></mat-datepicker-toggle>
                    <mat-datepicker #pickerDue></mat-datepicker>
                    <mat-error>Date requise</mat-error>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>TVA (%)</mat-label>
                  <input matInput type="number" formControlName="taxRate"
                         min="0" max="100" step="0.5">
                  <span matSuffix>%</span>
                </mat-form-field>

              </mat-card-content>
            </mat-card>

            <!-- Notes -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>notes</mat-icon>
                <mat-card-title>Notes & Conditions</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="3" placeholder="Notes internes..."></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Conditions de paiement</mat-label>
                  <textarea matInput formControlName="termsAndConditions" rows="3"
                            placeholder="Ex: Paiement sous 30 jours..."></textarea>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

          </div>

          <!-- Right col -->
          <div class="right-col">

            <!-- Items -->
            <mat-card class="form-card items-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>list</mat-icon>
                <mat-card-title>Lignes de facturation</mat-card-title>
              </mat-card-header>
              <mat-card-content>

                <!-- Column headers -->
                <div class="items-header">
                  <span class="col-desc">Description *</span>
                  <span class="col-unit">Unité</span>
                  <span class="col-qty">Qté *</span>
                  <span class="col-price">Prix HT *</span>
                  <span class="col-total">Total HT</span>
                  <span class="col-action"></span>
                </div>

                <div formArrayName="items">
                  <div *ngFor="let item of itemsArray.controls; let i = index" [formGroupName]="i" class="item-row">

                    <mat-form-field appearance="outline" class="col-desc">
                      <input matInput formControlName="description" placeholder="Service ou produit...">
                      <mat-error>Requis</mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-unit">
                      <input matInput formControlName="unit" placeholder="h, pièce...">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-qty">
                      <input matInput type="number" formControlName="quantity" min="0.01" step="0.01">
                      <mat-error>Requis</mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-price">
                      <input matInput type="number" formControlName="unitPrice" min="0" step="0.01">
                      <span matSuffix>€</span>
                      <mat-error>Requis</mat-error>
                    </mat-form-field>

                    <div class="col-total item-total">
                      <strong>{{ getItemTotal(i) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                    </div>

                    <div class="col-action">
                      <button mat-icon-button type="button" color="warn"
                              (click)="removeItem(i)" matTooltip="Supprimer"
                              [disabled]="itemsArray.length === 1">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>

                  </div>
                </div>

                <button mat-stroked-button type="button" color="primary" class="add-item-btn" (click)="addItem()">
                  <mat-icon>add</mat-icon>
                  Ajouter une ligne
                </button>

                <!-- Totals -->
                <mat-divider style="margin: 20px 0;"></mat-divider>
                <div class="totals-section">
                  <div class="total-row">
                    <span>Sous-total HT</span>
                    <span>{{ subtotal | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                  </div>
                  <div class="total-row">
                    <span>TVA ({{ form.get('taxRate')?.value || 0 }}%)</span>
                    <span>{{ taxAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="total-row total-final">
                    <span>Total TTC</span>
                    <strong>{{ total | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                  </div>
                </div>

              </mat-card-content>
            </mat-card>

          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <a mat-stroked-button routerLink="/invoices">Annuler</a>
          <button mat-raised-button color="primary" type="submit" [disabled]="submitting">
            <mat-spinner diameter="18" *ngIf="submitting" style="display:inline-block; margin-right:8px;"></mat-spinner>
            {{ submitting ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la facture') }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; }

    .page-header {
      margin-bottom: 28px;

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.88rem;
        margin-bottom: 8px;

        mat-icon { font-size: 18px; width: 18px; height: 18px; }
        &:hover { color: #2563eb; }
      }

      h1 { font-size: 1.9rem; font-weight: 700; color: #1e293b; margin: 0; }
    }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .form-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }

    .form-card {
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;

      mat-card-header { padding: 20px 20px 0; margin-bottom: 8px; }
      mat-card-content { padding: 16px 20px 20px !important; }

      mat-icon[mat-card-avatar] {
        background: #eff6ff;
        color: #2563eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        font-size: 20px;
      }
    }

    .full-width { width: 100%; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* Items table */
    .items-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1.4fr 1.2fr 44px;
      gap: 8px;
      padding: 0 12px 6px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 8px;

      span {
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .col-qty, .col-price, .col-total { text-align: right; }
    }

    .item-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1.4fr 1.2fr 44px;
      gap: 8px;
      align-items: center;
      padding: 4px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      background: #f8fafc;
    }

    .item-row:hover { background: #f1f5f9; }

    /* Make form fields fill their grid cell and hide bottom hint space */
    .item-row mat-form-field { width: 100%; }
    ::ng-deep .item-row .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    ::ng-deep .col-qty .mat-mdc-input-element,
    ::ng-deep .col-price .mat-mdc-input-element { text-align: right; }

    .item-total {
      text-align: right;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      padding-right: 4px;
    }

    .col-action { display: flex; justify-content: center; }

    .add-item-btn {
      width: 100%;
      border-style: dashed !important;
      margin-top: 4px;
    }

    .totals-section {
      max-width: 320px;
      margin-left: auto;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 0.95rem;
      color: #475569;
    }

    .total-final {
      font-size: 1.1rem;
      color: #1e293b;
      padding-top: 12px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
      padding-bottom: 40px;
    }
  `]
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  clients: Client[] = [];
  loading = true;
  submitting = false;
  isEditMode = false;
  invoiceId?: number;

  subtotal = 0;
  taxAmount = 0;
  total = 0;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.invoiceId = this.route.snapshot.params['id']
      ? Number(this.route.snapshot.params['id'])
      : undefined;
    this.isEditMode = !!this.invoiceId;

    this.clientService.getAllClients().subscribe({
      next: (c) => { this.clients = c; },
      error: () => this.notification.error('Erreur chargement clients')
    });

    if (this.isEditMode) {
      this.invoiceService.getInvoiceById(this.invoiceId!).subscribe({
        next: (inv) => { this.patchForm(inv); this.loading = false; },
        error: () => { this.notification.error('Facture introuvable'); this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  buildForm(): void {
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 30);

    const currentUser = this.authService.currentUser();
    // Default 20% tax, unless it's a micro-enterprise or individual
    const defaultTaxRate = (currentUser && (currentUser.companyType === 'MICRO' || currentUser.companyType === 'NONE')) ? 0 : 20;
    const isTaxDisabled = (currentUser && (currentUser.companyType === 'MICRO' || currentUser.companyType === 'NONE'));

    this.form = this.fb.group({
      clientId: [null, Validators.required],
      issueDate: [today, Validators.required],
      dueDate: [due, Validators.required],
      taxRate: [{ value: defaultTaxRate, disabled: isTaxDisabled }, [Validators.min(0), Validators.max(100)]],
      notes: [''],
      termsAndConditions: ['Paiement sous 30 jours. Tout retard entraîne des pénalités.'],
      items: this.fb.array([this.createItemGroup()])
    });

    this.subs.add(this.form.get('taxRate')!.valueChanges.subscribe(() => this.recalculate()));
    this.subs.add(this.itemsArray.valueChanges.subscribe(() => this.recalculate()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      unit: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
    this.recalculate();
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.recalculate();
    }
  }

  recalculate(): void {
    this.subtotal = this.itemsArray.controls.reduce((sum: number, ctrl) => {
      const qty = Number(ctrl.get('quantity')?.value || 0);
      const price = Number(ctrl.get('unitPrice')?.value || 0);
      return sum + qty * price;
    }, 0);

    const rate = Number(this.form.get('taxRate')?.value || 0);
    this.taxAmount = this.subtotal * (rate / 100);
    this.total = this.subtotal + this.taxAmount;
  }

  getItemTotal(index: number): number {
    const ctrl = this.itemsArray.at(index);
    const qty = Number(ctrl.get('quantity')?.value || 0);
    const price = Number(ctrl.get('unitPrice')?.value || 0);
    return qty * price;
  }

  patchForm(inv: Invoice): void {
    this.form.patchValue({
      clientId: inv.clientId,
      issueDate: inv.issueDate ? new Date(inv.issueDate) : null,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
      taxRate: inv.taxRate,
      notes: inv.notes,
      termsAndConditions: inv.termsAndConditions
    });

    while (this.itemsArray.length) this.itemsArray.removeAt(0);
    (inv.items || []).forEach((item) => {
      this.itemsArray.push(this.fb.group({
        id: [item.id],
        description: [item.description, Validators.required],
        unit: [item.unit || ''],
        quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
        unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]]
      }));
    });

    this.recalculate();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;

    // Use getRawValue() to include disabled fields like taxRate (if disabled)
    const raw = this.form.getRawValue();
    const payload: Invoice = {
      clientId: raw.clientId,
      issueDate: this.formatDateForApi(raw.issueDate),
      dueDate: this.formatDateForApi(raw.dueDate),
      taxRate: raw.taxRate,
      notes: raw.notes,
      termsAndConditions: raw.termsAndConditions,
      items: raw.items.map((it: any) => ({
        id: it.id,
        description: it.description,
        unit: it.unit,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice)
      }))
    };

    const call = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
      : this.invoiceService.createInvoice(payload);

    call.subscribe({
      next: (inv) => {
        this.notification.success(this.isEditMode ? 'Facture mise à jour !' : 'Facture créée avec succès !');
        this.router.navigate(['/invoices', inv.id]);
      },
      error: () => {
        this.notification.error('Erreur lors de l\'enregistrement');
        this.submitting = false;
      }
    });
  }

  private formatDateForApi(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
