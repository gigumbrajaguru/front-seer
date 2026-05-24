import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  ApiCombinedReadingRequest,
  ApiSpreadSuggestionRequest,
  ApiSpreadSuggestionResponse,
  FinalSummaryResponse,
} from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  /** Waits for any pending sign-in verify, then returns auth headers. */
  private authHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getSessionTokenAsync()).pipe(
      switchMap(token =>
        from([token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders()])
      )
    );
  }

  submitFinalSummary(request: ApiCombinedReadingRequest): Observable<FinalSummaryResponse> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.post<FinalSummaryResponse>(`${this.baseUrl}/api/reading/final-summary`, request, { headers })
      )
    );
  }

  suggestSpreads(request: ApiSpreadSuggestionRequest): Observable<ApiSpreadSuggestionResponse> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.post<ApiSpreadSuggestionResponse>(`${this.baseUrl}/api/spreads`, request, { headers })
      )
    );
  }
}
