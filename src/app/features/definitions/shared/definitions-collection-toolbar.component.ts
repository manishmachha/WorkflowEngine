import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DefinitionsViewMode } from './definitions-collection';

@Component({
  selector: 'definitions-collection-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'definitions-collection-toolbar-host',
    '[class.compact]': 'compact()',
  },
  imports: [FormsModule],
  template: `
    <div class="definitions-collection-toolbar">
      <div class="definitions-search-wrap">
        <i class="bi bi-search definitions-search-icon" aria-hidden="true"></i>
        <input
          class="wfe-input definitions-search-input"
          type="search"
          [ngModel]="search()"
          (ngModelChange)="searchChange.emit($event)"
          placeholder="Search…"
          aria-label="Search rows"
        />
      </div>

      <div class="definitions-view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [class.active]="view() === 'cards'"
          (click)="viewChange.emit('cards')"
          title="Card view"
        >
          <i class="bi bi-grid-3x3-gap"></i>
        </button>
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [class.active]="view() === 'table'"
          (click)="viewChange.emit('table')"
          title="Table view"
        >
          <i class="bi bi-table"></i>
        </button>
      </div>

      <div class="definitions-toolbar-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .definitions-collection-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
    .definitions-search-wrap {
      position: relative;
      flex: 1 1 220px;
      min-width: 200px;
      max-width: 420px;
    }
    .definitions-search-icon {
      position: absolute;
      left: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }
    .definitions-search-input {
      padding-left: 2.1rem;
    }
    .definitions-view-toggle {
      display: inline-flex;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
    }
    .definitions-view-toggle .wfe-btn {
      border-radius: 0;
      border: none;
    }
    .definitions-view-toggle .wfe-btn.active {
      background: var(--accent-soft, #eef2ff);
      color: var(--accent-strong, #3730a3);
      box-shadow: inset 0 0 0 1px rgb(99 102 241 / 0.35);
    }
    :host(.compact) .definitions-collection-toolbar {
      margin-bottom: 0;
      flex: 1 1 auto;
      min-width: 0;
    }
    :host(.compact) {
      display: block;
      flex: 1 1 280px;
      min-width: 0;
    }
    .definitions-toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }
  `,
})
export class DefinitionsCollectionToolbarComponent {
  search = input('');
  view = input<DefinitionsViewMode>('cards');
  /** When true, drops bottom margin for embedding in a single toolbar row. */
  compact = input(false);
  searchChange = output<string>();
  viewChange = output<DefinitionsViewMode>();
}
