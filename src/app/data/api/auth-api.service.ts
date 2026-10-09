import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';
import { LoginRequest, LoginResponse } from './api-models';

@Injectable({ providedIn: 'root' })
export class AuthApiService extends ApiBase {
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', body);
  }
}
