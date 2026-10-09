import { Component, input, output } from '@angular/core';

@Component({
  selector: 'definitions-paginator',
  standalone: true,
  template: `
    <div class="definitions-paginator" role="navigation" aria-label="Pagination">
      <div class="definitions-paginator-meta">
        {{ rangeLabel() }}
      </div>
      <div class="definitions-paginator-controls">
        <label class="definitions-page-size">
          <span class="sr-only">Page size</span>
          <select
            class="wfe-select wfe-select-sm"
            [value]="pageSize()"
            (change)="onPageSize($any($event.target).value)"
          >
            @for (n of pageSizeOptions(); track n) {
              <option [value]="n">{{ n }} / page</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [disabled]="pageIndex() <= 0"
          (click)="go(0)"
          title="First page"
        >
          <i class="bi bi-chevron-bar-left"></i>
        </button>
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [disabled]="pageIndex() <= 0"
          (click)="go(pageIndex() - 1)"
          title="Previous page"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="definitions-page-index">Page {{ pageIndex() + 1 }} of {{ pageCount() }}</span>
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [disabled]="pageIndex() >= pageCount() - 1"
          (click)="go(pageIndex() + 1)"
          title="Next page"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
        <button
          type="button"
          class="wfe-btn wfe-btn-ghost wfe-btn-icon"
          [disabled]="pageIndex() >= pageCount() - 1"
          (click)="go(pageCount() - 1)"
          title="Last page"
        >
          <i class="bi bi-chevron-bar-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: `
    .definitions-paginator {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.8125rem;
      color: #475569;
    }
    .definitions-paginator-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }
    .definitions-page-size .wfe-select-sm {
      min-width: 6.5rem;
      padding: 0.35rem 0.5rem;
      font-size: 0.8125rem;
    }
    .definitions-page-index {
      padding: 0 0.35rem;
      font-weight: 600;
      color: #334155;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `,
})
export class DefinitionsPaginatorComponent {
  pageIndex = input(0);
  pageSize = input(12);
  total = input(0);
  pageSizeOptions = input<number[]>([6, 12, 24]);

  pageIndexChange = output<number>();
  pageSizeChange = output<number>();

  pageCount(): number {
    const size = this.pageSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(this.total() / size));
  }

  rangeLabel(): string {
    const total = this.total();
    if (total === 0) return 'No rows';
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min(total, (this.pageIndex() + 1) * this.pageSize());
    return `${start}–${end} of ${total}`;
  }

  go(index: number) {
    const clamped = Math.max(0, Math.min(index, this.pageCount() - 1));
    this.pageIndexChange.emit(clamped);
  }

  onPageSize(raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSizeChange.emit(n);
    this.pageIndexChange.emit(0);
  }
}
