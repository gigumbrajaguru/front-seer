import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  // Auth headers + refresh-on-401 are applied by the authInterceptor.

  getProfile(): Observable<BackendProfile> {
    return this.http.get<BackendProfile>(`${this.baseUrl}/api/user/profile`);
  }

  getQuestions(skip = 0, limit = 30): Observable<QuestionsResponse> {
    return this.http.get<QuestionsResponse>(`${this.baseUrl}/api/user/questions`, {
      params: { skip: skip.toString(), limit: limit.toString() },
    });
  }

  getReadings(skip = 0, limit = 20): Observable<ReadingsResponse> {
    return this.http.get<ReadingsResponse>(`${this.baseUrl}/api/user/readings`, {
      params: { skip: skip.toString(), limit: limit.toString() },
    });
  }

  updateProfile(data: UpdateProfileRequest): Observable<BackendProfile> {
    return this.http.patch<BackendProfile>(`${this.baseUrl}/api/user/profile`, data);
  }
}
