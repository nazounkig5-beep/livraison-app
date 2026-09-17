import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incident } from '../models/incident.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly apiUrl = `${environment.apiUrl}/incidents`;

  constructor(private http: HttpClient) {}

  liste(): Observable<Incident[]> {
    return this.http.get<Incident[]>(this.apiUrl);
  }

  signaler(id_demande: number, description: string): Observable<Incident> {
    return this.http.post<Incident>(this.apiUrl, { id_demande, description });
  }

  resoudre(id: number) {
    return this.http.post(`${environment.apiUrl}/admin/incidents/${id}/resoudre`, {});
  }
}
