import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface BackendProfile {
  user_id: string;
  provider: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  question_count: number;
  reading_count: number;
  created_at: string | null;
  last_seen: string | null;
}

export interface QuestionHistoryItem {
  question_id: string;
  question: string;
  created_at: string;
}

export interface QuestionsResponse {
  questions: QuestionHistoryItem[];
  total: number;
}

export interface ReadingHistoryItem {
  reading_id: string;
  question: string;
  systems: string[];
  verdict: string;
  created_at: string;
}

export interface ReadingsResponse {
  readings: ReadingHistoryItem[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  private get headers(): HttpHeaders {
    return new HttpHeaders(this.authService.getAuthHeaders());
  }

  getProfile(): Observable<BackendProfile> {
    return this.http.get<BackendProfile>(`${this.baseUrl}/api/user/profile`, {
      headers: this.headers,
    });
  }

  getQuestions(skip = 0, limit = 30): Observable<QuestionsResponse> {
    return this.http.get<QuestionsResponse>(`${this.baseUrl}/api/user/questions`, {
      headers: this.headers,
      params: { skip: skip.toString(), limit: limit.toString() },
    });
  }

  getReadings(skip = 0, limit = 20): Observable<ReadingsResponse> {
    return this.http.get<ReadingsResponse>(`${this.baseUrl}/api/user/readings`, {
      headers: this.headers,
      params: { skip: skip.toString(), limit: limit.toString() },
    });
  }
}
