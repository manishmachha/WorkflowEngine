import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'definitions-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="wfe-studio">
      <nav class="wfe-studio-subnav" aria-label="Workflow studio">
        <div class="wfe-studio-subnav-inner">
          <span class="wfe-studio-subnav-label">Studio</span>
          @for (t of tabs; track t.path) {
            <a
              [routerLink]="t.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: t.exact ?? false }"
              class="wfe-studio-nav-link"
              [title]="t.label"
              [attr.aria-label]="t.label"
            >
              <i class="bi {{ t.icon }}"></i>
            </a>
          }
        </div>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class DefinitionsShellComponent {
  tabs = [
    { path: '/definitions', icon: 'bi-diagram-3-fill', label: 'Workflow definitions', exact: true },
    { path: '/definitions/action-library', icon: 'bi-lightning-charge-fill', label: 'Action library' },
    {
      path: '/definitions/transition-catalog',
      icon: 'bi-signpost-split-fill',
      label: 'Transition catalog',
    },
  ];
}
