import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: number;
  level: ToastLevel;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private seq = 1;

  private push(level: ToastLevel, message: string, ttlMs = 4000) {
    const id = this.seq++;
    this._toasts.update((v) => [...v, { id, level, message }]);
    setTimeout(() => this.dismiss(id), ttlMs);
  }

  info(msg: string) {
    this.push('info', msg);
  }
  success(msg: string) {
    this.push('success', msg);
  }
  warn(msg: string) {
    this.push('warn', msg);
  }
  error(msg: string) {
    this.push('error', msg, 6000);
  }

  dismiss(id: number) {
    this._toasts.update((v) => v.filter((t) => t.id !== id));
  }
}
