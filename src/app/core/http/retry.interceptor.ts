import { HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 2,
      delay: (err, attempt) => {
        if (err?.status === 0 || err?.status >= 500) return timer(attempt * 500);
        throw err;
      },
    }),
  );
};
