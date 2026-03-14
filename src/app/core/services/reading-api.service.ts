import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiReadingRequest, ApiReadingResponse } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  submitReading(request: ApiReadingRequest): Observable<ApiReadingResponse> {
    return this.http.post<ApiReadingResponse>(`${this.baseUrl}/api/reading`, request);
  }
}
