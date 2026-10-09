import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nStore } from '../../core/i18n/i18n.store';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nStore);
  transform(key: string): string {
    return this.i18n.t(key);
  }
}
