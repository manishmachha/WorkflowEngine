import { Injectable, computed, inject, signal } from '@angular/core';
import { DefinitionsApi } from '../../data/definitions.api';
import { WorkflowDefinition } from '../../domain/definition';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { validateDefinition } from '../designer/validation/validate';
import { WorkflowDefinitionDto } from '../../data/api/api-models';
import { canArchiveVersion, canPublishVersion } from './workflow-version-lifecycle';

@Injectable({ providedIn: 'root' })
export class DefinitionsStore {
  private api = inject(DefinitionsApi);
  private toast = inject(ToastService);

  private _list = signal<WorkflowDefinition[]>([]);
  private _loading = signal(false);
  private _search = signal('');

  readonly list = this._list.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly search = this._search.asReadonly();

  readonly filtered = computed(() => {
    const q = this._search().toLowerCase();
    const grouped = new Map<string, WorkflowDefinition>();
    for (const d of this._list()) {
      const existing = grouped.get(d.id);
      if (!existing || d.version > existing.version) grouped.set(d.id, d);
    }
    return [...grouped.values()].filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q),
    );
  });

  load() {
    this._loading.set(true);
    this.api.list().subscribe({
      next: (v) => this._list.set(v),
      complete: () => this._loading.set(false),
    });
  }

  setFromBackend(defs: WorkflowDefinitionDto[]) {
    this._loading.set(true);
    this._list.set(
      defs.map((d) => ({
        id: d.id,
        code: d.workflowKey,
        name: d.name,
        description: d.description || undefined,
        version: 1,
        status: 'draft' as const,
        tenantId: d.organizationId,
        entityType: 'case',
        nodes: [],
        transitions: [],
        variables: [],
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    );
    this._loading.set(false);
  }

  setSearch(q: string) {
    this._search.set(q);
  }

  publish(id: string, version: number, status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (status && !canPublishVersion(status)) {
      this.toast.error(
        status === 'ARCHIVED'
          ? 'Archived versions cannot be published. Create a new draft instead.'
          : 'Only draft versions can be published.',
      );
      return;
    }
    this.api.get(id, version).subscribe(def => {
      if (!def) {
        this.toast.error('Definition not found');
        return;
      }
      if (def.status !== 'draft') {
        this.toast.error(
          def.status === 'retired'
            ? 'Archived versions cannot be published. Create a new draft instead.'
            : 'Only draft versions can be published.',
        );
        return;
      }
      const issues = validateDefinition(def);
      const errors = issues.filter((i) => i.severity === 'error');
      if (errors.length) {
        this.toast.error(
          `Cannot publish — ${errors.length} validation error(s). Open the designer to review.`,
        );
        return;
      }
      this.api.publish(id, version).subscribe({
        next: (d) => {
          this.load();
          this.toast.success(`Published ${d.name} v${d.version}`);
        },
        error: (err: { error?: { message?: string } }) =>
          this.toast.error(err.error?.message || 'Publish failed'),
      });
    });
  }

  archive(id: string, version: number, status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (status && !canArchiveVersion(status)) {
      this.toast.error(
        status === 'DRAFT'
          ? 'Draft versions cannot be archived. Publish first, or delete the draft in the designer.'
          : 'Only the currently published version can be archived.',
      );
      return;
    }
    this.api.archive(id, version).subscribe({
      next: (d) => {
        this.load();
        this.toast.success(`Archived v${d.version}`);
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Archive failed'),
    });
  }

  createDraft(baseId: string, sourceVersionId?: string) {
    this._loading.set(true);
    this.api.createDraft(baseId, sourceVersionId).subscribe({
      next: (d) => {
        this.load();
        this.toast.success(`Created draft v${d.version} from previous configuration`);
        this._loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message || 'Failed to create draft');
        this._loading.set(false);
      },
    });
  }
}
