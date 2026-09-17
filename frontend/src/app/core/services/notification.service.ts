import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationApp } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  liste(): Observable<NotificationApp[]> {
    return this.http.get<NotificationApp[]>(this.apiUrl);
  }

  marquerLue(id: number) {
    return this.http.post(`${this.apiUrl}/${id}/lue`, {});
  }

  marquerToutesLues() {
    return this.http.post(`${this.apiUrl}/tout-lire`, {});
  }
}
