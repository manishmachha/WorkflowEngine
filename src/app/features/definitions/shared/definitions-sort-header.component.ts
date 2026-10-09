import { Component, input, output } from '@angular/core';
import { SortDirection } from './definitions-collection';

@Component({
  selector: 'th[definitionsSortHeader]',
  standalone: true,
  host: {
    class: 'wfe-th-sortable',
    '(click)': 'onClick()',
  },
  template: `
    <span class="wfe-th-sort-inner">
      <ng-content />
      @if (active()) {
        <i class="bi" [class.bi-arrow-up]="direction() === 'asc'" [class.bi-arrow-down]="direction() === 'desc'"></i>
      }
    </span>
  `,
  styles: `
    :host {
      cursor: pointer;
      user-select: none;
    }
    :host:hover {
      background: #e2e8f0 !important;
    }
    .wfe-th-sort-inner {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
  `,
})
export class DefinitionsSortHeaderComponent {
  sortKey = input.required<string>({ alias: 'definitionsSortHeader' });
  activeKey = input('');
  direction = input<SortDirection>('asc');
  sort = output<string>();

  active(): boolean {
    return this.activeKey() === this.sortKey();
  }

  onClick() {
    this.sort.emit(this.sortKey());
  }
}
