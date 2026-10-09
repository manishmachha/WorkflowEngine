import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Directive({
  selector: '[wfePermission]',
  standalone: true,
})
export class PermissionDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthStore);
  private required: string[] = [];
  private embedded = false;

  @Input() set wfePermission(roles: string | string[]) {
    this.required = Array.isArray(roles) ? roles : [roles];
  }

  constructor() {
    effect(() => {
      const roles = this.auth.roles();
      const ok = this.required.length === 0 || this.required.some((r) => roles.includes(r));
      if (ok && !this.embedded) {
        this.vcr.createEmbeddedView(this.tpl);
        this.embedded = true;
      } else if (!ok && this.embedded) {
        this.vcr.clear();
        this.embedded = false;
      }
    });
  }
}
