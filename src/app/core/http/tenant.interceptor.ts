import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenant = inject(AuthStore).activeTenantId();
  if (!tenant) return next(req);
  return next(req.clone({ setHeaders: { 'X-Tenant-Id': tenant } }));
};
