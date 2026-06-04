import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const API_BASE = environment.apiBaseUrl.replace(/\/+$/, '');
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Sends the session cookie with every API call (`withCredentials`) and attaches
 * the CSRF token header on mutating requests. On a 401 it refreshes the session
 * once (via the httpOnly refresh cookie) and retries. `/auth/*` endpoints are
 * passed through with credentials but without the refresh-retry (AuthService
 * drives those directly).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const isAuthEndpoint = req.url.startsWith(`${API_BASE}/auth/`);
  const withCreds = applyCredentials(req, auth);

  if (isAuthEndpoint) {
    return next(withCreds);
  }

  return from(auth.whenReady()).pipe(
    switchMap(() =>
      next(withCreds).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            return from(auth.refreshSession()).pipe(
              switchMap(ok =>
                ok ? next(applyCredentials(req, auth)) : throwError(() => error)
              )
            );
          }
          return throwError(() => error);
        })
      )
    )
  );
};

/** Clone a request to send cookies, plus the CSRF header for mutating methods. */
function applyCredentials(req: HttpRequest<unknown>, auth: AuthService): HttpRequest<unknown> {
  const setHeaders: Record<string, string> = {};
  if (MUTATING.has(req.method.toUpperCase())) {
    const csrf = auth.getCsrfToken();
    if (csrf) setHeaders['X-CSRF-Token'] = csrf;
  }
  return req.clone({ withCredentials: true, setHeaders });
}
