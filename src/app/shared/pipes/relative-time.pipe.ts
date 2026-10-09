import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(input?: string | Date | null): string {
    if (!input) return '';
    const d = typeof input === 'string' ? new Date(input) : input;
    const diff = Date.now() - d.getTime();
    const abs = Math.abs(diff);
    const s = Math.floor(abs / 1000);
    if (s < 60) return diff >= 0 ? `${s}s ago` : `in ${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return diff >= 0 ? `${m}m ago` : `in ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return diff >= 0 ? `${h}h ago` : `in ${h}h`;
    const dd = Math.floor(h / 24);
    return diff >= 0 ? `${dd}d ago` : `in ${dd}d`;
  }
}
