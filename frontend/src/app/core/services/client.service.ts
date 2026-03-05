import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, PageResponse } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = `${environment.apiUrl}/clients`;
  private allClients$?: Observable<Client[]>;

  constructor(private http: HttpClient) {}

  getClients(page = 0, size = 10, search?: string, sort = 'createdAt', direction = 'desc'): Observable<PageResponse<Client>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<Client>>(this.apiUrl, { params });
  }

  getAllClients(): Observable<Client[]> {
    if (!this.allClients$) {
      this.allClients$ = this.http.get<Client[]>(`${this.apiUrl}/all`).pipe(
        shareReplay(1)
      );
    }
    return this.allClients$;
  }

  invalidateCache(): void {
    this.allClients$ = undefined;
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }
}
