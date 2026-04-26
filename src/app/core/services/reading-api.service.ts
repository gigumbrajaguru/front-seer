import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiCombinedReadingRequest,
  ApiReadingRequest,
  ApiReadingResponse,
  ApiSpreadSuggestionRequest,
  ApiSpreadSuggestionResponse,
} from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  /** Requests interpretation for one oracle method and its selected cards. */
  submitReading(request: ApiReadingRequest): Observable<ApiReadingResponse> {
    return this.http.post<ApiReadingResponse>(`${this.baseUrl}/api/reading`, request);
  }

  /** Requests the single final verdict/finalized answer shown at the top of results. */
  submitFinalSummary(request: ApiCombinedReadingRequest): Observable<ApiReadingResponse> {
    return this.http.post<ApiReadingResponse>(`${this.baseUrl}/api/reading/final-summary`, request);
  }

  /** Requests AI spread recommendations from the user's question and optional context. */
  suggestSpreads(request: ApiSpreadSuggestionRequest): Observable<ApiSpreadSuggestionResponse> {
    return this.http.post<ApiSpreadSuggestionResponse>(`${this.baseUrl}/api/spreads`, request);
  }
}
