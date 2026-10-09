import { Injectable, computed, inject, signal } from '@angular/core';
import { DefinitionsApi } from '../../data/definitions.api';
import {
  NODE_KINDS,
  NodeKind,
  Transition,
  WorkflowDefinition,
  WorkflowNode,
} from '../../domain/definition';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { validateDefinition, ValidationIssue } from './validation/validate';

@Injectable({ providedIn: 'root' })
export class DesignerStore {
  private api = inject(DefinitionsApi);
  private toast = inject(ToastService);

  private _def = signal<WorkflowDefinition | null>(null);
  private _selectedNodeId = signal<string | null>(null);
  private _selectedTransitionId = signal<string | null>(null);
  private _history = signal<WorkflowDefinition[]>([]);
  private _future = signal<WorkflowDefinition[]>([]);
  private _dirty = signal(false);

  readonly def = this._def.asReadonly();
  readonly dirty = this._dirty.asReadonly();
  readonly selectedNode = computed(() =>
    this._def()?.nodes.find((n) => n.id === this._selectedNodeId()) ?? null,
  );
  readonly selectedTransition = computed(() =>
    this._def()?.transitions.find((t) => t.id === this._selectedTransitionId()) ?? null,
  );
  readonly canUndo = computed(() => this._history().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  readonly issues = computed<ValidationIssue[]>(() => {
    const d = this._def();
    return d ? validateDefinition(d) : [];
  });
  readonly isDraftVersion = computed(() => this._def()?.status === 'draft');

  readonly canPublish = computed(
    () =>
      this.isDraftVersion() && !this.issues().some((i) => i.severity === 'error'),
  );

  load(id: string, version: number) {
    this.api.get(id, version).subscribe((d) => {
      if (d) {
        this._def.set(JSON.parse(JSON.stringify(d)));
        this._history.set([]);
        this._future.set([]);
        this._dirty.set(false);
      }
    });
  }

  save() {
    const d = this._def();
    if (!d) return;
    if (d.status !== 'draft') {
      this.toast.error(
        d.status === 'retired'
          ? 'Archived versions are read-only. Create a new draft from the workflow hub.'
          : 'Published versions are read-only. Create a new draft to edit.',
      );
      return;
    }
    this.api.save(d).subscribe({
      next: () => {
        this._dirty.set(false);
        this.toast.success('Saved draft');
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Save failed'),
    });
  }

  publish() {
    const d = this._def();
    if (!d) return;
    if (d.status !== 'draft') {
      this.toast.error(
        d.status === 'retired'
          ? 'Archived versions cannot be published. Open the workflow hub and create a new draft.'
          : 'Only draft versions can be published.',
      );
      return;
    }
    if (this.issues().some((i) => i.severity === 'error')) {
      this.toast.warn('Fix validation errors before publishing');
      return;
    }
    this.api.publish(d.id, d.version).subscribe({
      next: (published) => {
        this._def.set(published);
        this.toast.success('Published');
      },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message || 'Publish failed'),
    });
  }

  selectNode(id: string | null) {
    this._selectedNodeId.set(id);
    this._selectedTransitionId.set(null);
  }

  selectTransition(id: string | null) {
    this._selectedTransitionId.set(id);
    this._selectedNodeId.set(null);
  }

  private mutate(fn: (d: WorkflowDefinition) => WorkflowDefinition) {
    const cur = this._def();
    if (!cur) return;
    this._history.update((h) => [...h, JSON.parse(JSON.stringify(cur))].slice(-50));
    this._future.set([]);
    this._def.set(fn(JSON.parse(JSON.stringify(cur))));
    this._dirty.set(true);
  }

  undo() {
    const h = this._history();
    if (!h.length) return;
    const cur = this._def()!;
    const prev = h[h.length - 1];
    this._history.set(h.slice(0, -1));
    this._future.update((f) => [cur, ...f]);
    this._def.set(prev);
    this._dirty.set(true);
  }

  redo() {
    const f = this._future();
    if (!f.length) return;
    const cur = this._def()!;
    const next = f[0];
    this._future.set(f.slice(1));
    this._history.update((h) => [...h, cur]);
    this._def.set(next);
    this._dirty.set(true);
  }

  addNode(kind: NodeKind, x: number, y: number) {
    const id = 'n' + Math.random().toString(36).slice(2, 8);
    const meta = NODE_KINDS.find((k) => k.kind === kind);
    this.mutate((d) => ({
      ...d,
      nodes: [
        ...d.nodes,
        {
          id,
          kind,
          label: meta?.label ?? kind,
          ui: { x, y },
          ...(kind === 'systemTask' || kind === 'apiCall'
            ? {
                failure: {
                  maxAttempts: 3,
                  backoff: 'exponential',
                  backoffSeconds: 30,
                  timeoutSeconds: 30,
                  onTerminalFailure: 'needs_attention',
                },
              }
            : {}),
        },
      ],
    }));
    this.selectNode(id);
  }

  moveNode(id: string, x: number, y: number) {
    this.mutate((d) => ({
      ...d,
      nodes: d.nodes.map((n) => (n.id === id ? { ...n, ui: { x, y } } : n)),
    }));
  }

  updateNode(id: string, patch: Partial<WorkflowNode>) {
    this.mutate((d) => ({
      ...d,
      nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }

  deleteNode(id: string) {
    this.mutate((d) => ({
      ...d,
      nodes: d.nodes.filter((n) => n.id !== id),
      transitions: d.transitions.filter((t) => t.from !== id && t.to !== id),
    }));
    this.selectNode(null);
  }

  addTransition(from: string, to: string) {
    const id = 't' + Math.random().toString(36).slice(2, 8);
    this.mutate((d) => ({
      ...d,
      transitions: [...d.transitions, { id, from, to, priority: 10, isDefault: false }],
    }));
    this.selectTransition(id);
  }

  updateTransition(id: string, patch: Partial<Transition>) {
    this.mutate((d) => ({
      ...d,
      transitions: d.transitions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  deleteTransition(id: string) {
    this.mutate((d) => ({
      ...d,
      transitions: d.transitions.filter((t) => t.id !== id),
    }));
    this.selectTransition(null);
  }

  updateMeta(patch: Partial<WorkflowDefinition>) {
    this.mutate((d) => ({ ...d, ...patch }));
  }
}
