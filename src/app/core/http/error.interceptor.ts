import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { EventBusService } from '../events/event-bus.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const bus = inject(EventBusService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 409) {
        toast.error('State changed. Reload to see latest.');
        bus.emit({ type: 'version_conflict', url: req.url });
      } else if (err.status === 0) {
        toast.error('Network offline.');
      } else if (err.status >= 500) {
        toast.error(err.error?.message ?? 'Server error');
      } else if (err.status === 401) {
        toast.error('Session expired');
      } else if (err.status >= 400) {
        toast.warn(err.error?.message ?? `Request failed (${err.status})`);
      }
      return throwError(() => err);
    }),
  );
};
