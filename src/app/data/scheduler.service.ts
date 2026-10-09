import { Injectable, signal } from '@angular/core';

interface ScheduledTimer {
  id: string;
  fireAt: number;
  handler: () => void;
  purpose: string;
}

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private handles = new Map<string, ReturnType<typeof setTimeout>>();
  private _timers = signal<ScheduledTimer[]>([]);
  readonly timers = this._timers.asReadonly();

  schedule(id: string, delayMs: number, purpose: string, handler: () => void) {
    this.cancel(id);
    const fireAt = Date.now() + delayMs;
    const h = setTimeout(() => {
      this.handles.delete(id);
      this._timers.update((t) => t.filter((x) => x.id !== id));
      try {
        handler();
      } catch (err) {
        console.error('scheduled handler failed', err);
      }
    }, Math.max(0, delayMs));
    this.handles.set(id, h);
    this._timers.update((t) => [...t.filter((x) => x.id !== id), { id, fireAt, handler, purpose }]);
  }

  cancel(id: string) {
    const h = this.handles.get(id);
    if (h) clearTimeout(h);
    this.handles.delete(id);
    this._timers.update((t) => t.filter((x) => x.id !== id));
  }

  clearAll() {
    for (const h of this.handles.values()) clearTimeout(h);
    this.handles.clear();
    this._timers.set([]);
  }
}
