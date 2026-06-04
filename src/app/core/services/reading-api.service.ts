import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiCombinedReadingRequest,
  ApiSpreadSuggestionRequest,
  ApiSpreadSuggestionResponse,
  FinalSummaryResponse,
} from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  // Auth (token attach + refresh-on-401) is handled by the authInterceptor.

  submitFinalSummary(request: ApiCombinedReadingRequest): Observable<FinalSummaryResponse> {
    return this.http.post<FinalSummaryResponse>(`${this.baseUrl}/api/reading/final-summary`, request);
  }

  suggestSpreads(request: ApiSpreadSuggestionRequest): Observable<ApiSpreadSuggestionResponse> {
    return this.http.post<ApiSpreadSuggestionResponse>(`${this.baseUrl}/api/spreads`, request);
  }
}
