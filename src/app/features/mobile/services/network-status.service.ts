import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private _online = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly online = this._online.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._online.set(true));
      window.addEventListener('offline', () => this._online.set(false));
    }
  }
}
