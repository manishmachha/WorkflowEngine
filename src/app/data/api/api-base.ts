/**
 * Base API utilities.
 *
 * The wfengine backend wraps every response in:
 * { status: true, statusCode: number, data: T }
 *
 * This module provides helpers to unwrap that envelope.
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../core/config/env';

export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  data: T;
}

export abstract class ApiBase {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiBaseUrl;

  protected get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  protected post<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body ?? {})
      .pipe(map((r) => r.data));
  }

  protected put<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body ?? {})
      .pipe(map((r) => r.data));
  }

  protected patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body ?? {})
      .pipe(map((r) => r.data));
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`)
      .pipe(map((r) => r.data));
  }
}
