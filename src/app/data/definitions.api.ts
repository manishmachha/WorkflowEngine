import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { WorkflowDefinition } from '../domain/definition';
import { WorkflowDefinitionsApiService } from './api/workflow-definitions-api.service';
import { WorkflowVersionsApiService } from './api/workflow-versions-api.service';
import { WorkflowNodesApiService } from './api/workflow-nodes-api.service';
import { WorkflowTransitionsApiService } from './api/workflow-transitions-api.service';
import { WorkflowActionsApiService } from './api/workflow-actions-api.service';
import { ApiMapper } from './api/mapper';
import {
  WorkflowActionDto,
  WorkflowNodeDto,
  WorkflowTransitionDto,
  WorkflowVersionDto,
} from './api/api-models';

@Injectable({ providedIn: 'root' })
export class DefinitionsApi {
  private definitionsApi = inject(WorkflowDefinitionsApiService);
  private versionsApi = inject(WorkflowVersionsApiService);
  private nodesApi = inject(WorkflowNodesApiService);
  private transitionsApi = inject(WorkflowTransitionsApiService);
  private workflowActionsApi = inject(WorkflowActionsApiService);

  list(): Observable<WorkflowDefinition[]> {
    return this.definitionsApi.findByOrganization().pipe(
      map(defs => defs.map(d => ({
        id: d.id,
        code: d.workflowKey,
        name: d.name,
        description: d.description || undefined,
        version: 1, // Defaulting to 1 for list view if versions not fetched
        status: 'draft' as const,
        tenantId: d.organizationId,
        entityType: 'case',
        nodes: [],
        transitions: [],
        variables: [],
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })))
    );
  }

  get(id: string, version?: number): Observable<WorkflowDefinition | undefined> {
    return this.definitionsApi.findOne(id).pipe(
      switchMap(def => {
        return this.versionsApi.findAll(def.id).pipe(
          switchMap(versions => {
            if (versions.length === 0) {
              return of(undefined);
            }
            
            const targetVersion = version 
              ? versions.find(v => v.version === version) 
              : versions.find(v => v.status === 'PUBLISHED') || versions[0];
              
            if (!targetVersion) return of(undefined);

            return forkJoin({
              nodes: this.nodesApi.findByWorkflowVersion(def.id, targetVersion.id),
              transitions: this.transitionsApi.findAll(def.id, targetVersion.id)
            }).pipe(
              map(({ nodes, transitions }) => 
                ApiMapper.toFrontendDefinition(def, targetVersion, nodes, transitions)
              )
            );
          })
        );
      }),
      catchError(() => of(undefined))
    );
  }

  save(def: WorkflowDefinition): Observable<WorkflowDefinition> {
    if (!def.versionId) {
      return throwError(() => new Error('Cannot save definition without a versionId'));
    }

    return forkJoin({
      defUpdate: this.definitionsApi.update(def.id, {
        name: def.name,
        description: def.description,
        workflowKey: def.code
      }),
      versionUpdate: this.versionsApi.update(def.id, def.versionId, {
        startingDate: def.effectiveFrom,
        expiryDate: def.effectiveTo
      })
    }).pipe(
      switchMap(() => this.syncNodes(def)),
      switchMap((backendNodesMap) => this.syncTransitions(def, backendNodesMap)),
      switchMap(() => this.get(def.id, def.version) as Observable<WorkflowDefinition>)
    );
  }

  private syncNodes(def: WorkflowDefinition): Observable<Map<string, string>> {
    const vId = def.versionId!;
    return this.nodesApi.findByWorkflowVersion(def.id, vId).pipe(
      switchMap(existingNodes => {
        const tasks: Observable<any>[] = [];
        
        // Delete nodes not in frontend
        const frontendKeys = def.nodes.map(n => n.id);
        existingNodes.forEach(en => {
          if (!frontendKeys.includes(en.nodeKey)) {
            tasks.push(this.nodesApi.remove(def.id, vId, en.id));
          }
        });

        // Add or Update nodes
        def.nodes.forEach(fn => {
          const existing = existingNodes.find(en => en.nodeKey === fn.id);
          const dto: any = {
            nodeKey: fn.id,
            name: fn.label,
            description: fn.description,
            type: ApiMapper.mapNodeKindToBackend(fn.kind),
            formId: fn.formRef?.formId,
            formVersionId: fn.formRef?.formVersion?.toString(),
            configuration: {
              ui: fn.ui,
              assignment: fn.assignment,
              failure: fn.failure,
              sla: fn.sla,
              api: fn.api
            }
          };

          if (existing) {
            tasks.push(this.nodesApi.update(def.id, vId, existing.id, dto));
          } else {
            tasks.push(this.nodesApi.create(def.id, vId, dto));
          }
        });

        if (tasks.length === 0) {
          return of(null);
        }
        return forkJoin(tasks);
      }),
      switchMap(() => this.nodesApi.findByWorkflowVersion(def.id, vId)),
      map(updatedNodes => {
        const map = new Map<string, string>();
        updatedNodes.forEach(n => map.set(n.nodeKey, n.id));
        return map;
      })
    );
  }

  private syncTransitions(def: WorkflowDefinition, nodesMap: Map<string, string>): Observable<any> {
    const vId = def.versionId!;
    return this.transitionsApi.findAll(def.id, vId).pipe(
      switchMap(existingTrans => {
        const tasks: Observable<any>[] = [];
        
        // Delete
        const frontendKeys = def.transitions.map(t => t.id);
        existingTrans.forEach(et => {
          if (!frontendKeys.includes(et.transitionKey)) {
            tasks.push(this.transitionsApi.deleteTransition(def.id, vId, et.id));
          }
        });

        // Add / Update
        def.transitions.forEach(ft => {
          const existing = existingTrans.find(et => et.transitionKey === ft.id);
          const fromId = nodesMap.get(ft.from);
          const toId = nodesMap.get(ft.to);

          if (!fromId || !toId) return; // Skip invalid transitions

          const dto: any = {
            transitionKey: ft.id,
            name: ft.actionLabel || '',
            fromNodeId: fromId,
            toNodeId: toId,
            condition: ft.condition,
            priority: ft.priority,
            isDefault: ft.isDefault
          };

          if (existing) {
            tasks.push(this.transitionsApi.update(def.id, vId, existing.id, dto));
          } else {
            tasks.push(this.transitionsApi.create(def.id, vId, dto));
          }
        });

        if (tasks.length === 0) return of(null);
        return forkJoin(tasks);
      })
    );
  }

  publish(id: string, version: number): Observable<WorkflowDefinition> {
    return this.versionsApi.findAll(id).pipe(
      switchMap(versions => {
        const targetVersion = versions.find(v => v.version === version);
        if (!targetVersion) return throwError(() => new Error('not found'));
        return this.versionsApi.publish(id, targetVersion.id).pipe(
          switchMap(() => this.get(id, version) as Observable<WorkflowDefinition>)
        );
      })
    );
  }

  archive(id: string, version: number): Observable<WorkflowDefinition> {
    return this.versionsApi.findAll(id).pipe(
      switchMap(versions => {
        const targetVersion = versions.find(v => v.version === version);
        if (!targetVersion) return throwError(() => new Error('not found'));
        return this.versionsApi.archive(id, targetVersion.id).pipe(
          switchMap(() => this.get(id, version) as Observable<WorkflowDefinition>)
        );
      })
    );
  }

  createDraft(baseId: string, sourceVersionId?: string): Observable<WorkflowDefinition> {
    return this.versionsApi.findAll(baseId).pipe(
      switchMap((versions) => {
        if (!versions.length) {
          return throwError(() => new Error('No versions found'));
        }
        const sorted = [...versions].sort((a, b) => b.version - a.version);
        const source =
          (sourceVersionId ? versions.find((v) => v.id === sourceVersionId) : undefined) ??
          sorted[0];
        if (!source) {
          return throwError(() => new Error('Source version not found'));
        }
        return this.versionsApi
          .create(baseId, {
            startingDate: source.startingDate ?? undefined,
            expiryDate: source.expiryDate ?? undefined,
          })
          .pipe(
            switchMap((newVersion) =>
              this.cloneVersionContent(baseId, source, newVersion).pipe(
                switchMap(() => this.get(baseId, newVersion.version) as Observable<WorkflowDefinition>),
              ),
            ),
          );
      }),
    );
  }

  /** Copies nodes, transitions, and workflow actions from one version into another. */
  private cloneVersionContent(
    defId: string,
    source: WorkflowVersionDto,
    target: WorkflowVersionDto,
  ): Observable<void> {
    return forkJoin({
      nodes: this.nodesApi.findByWorkflowVersion(defId, source.id),
      transitions: this.transitionsApi.findAll(defId, source.id),
      actions: this.workflowActionsApi.findAll(),
    }).pipe(
      switchMap(({ nodes, transitions, actions }) => {
        const nodeIds = new Set(nodes.map((n) => n.id));
        const transIds = new Set(transitions.map((t) => t.id));
        const boundActions = actions.filter(
          (a) =>
            (a.workflowNodeId && nodeIds.has(a.workflowNodeId)) ||
            (a.workflowTransitionId && transIds.has(a.workflowTransitionId)),
        );

        if (nodes.length === 0) {
          return this.cloneWorkflowActions(boundActions, new Map(), new Map());
        }

        const nodeCreates = nodes.map((n) => this.cloneNode(defId, target.id, n));
        return forkJoin(nodeCreates).pipe(
          switchMap((createdNodes) => {
            const nodeIdMap = this.mapIdsByKey(nodes, createdNodes);
            const transitionPairs: {
              source: WorkflowTransitionDto;
              create: ReturnType<WorkflowTransitionsApiService['create']>;
            }[] = [];
            for (const t of transitions) {
              const fromNodeId = nodeIdMap.get(t.fromNodeId);
              const toNodeId = nodeIdMap.get(t.toNodeId);
              if (!fromNodeId || !toNodeId) {
                continue;
              }
              transitionPairs.push({
                source: t,
                create: this.transitionsApi.create(defId, target.id, {
                  transitionKey: t.transitionKey,
                  name: t.name,
                  fromNodeId,
                  toNodeId,
                  condition: t.condition ?? undefined,
                  priority: t.priority,
                  isDefault: t.isDefault,
                }),
              });
            }

            if (transitionPairs.length === 0) {
              return this.cloneWorkflowActions(boundActions, nodeIdMap, new Map());
            }

            return forkJoin(transitionPairs.map((p) => p.create)).pipe(
              switchMap((createdTrans) => {
                const transIdMap = new Map<string, string>();
                transitionPairs.forEach((pair, index) => {
                  transIdMap.set(pair.source.id, createdTrans[index].id);
                });
                return this.cloneWorkflowActions(boundActions, nodeIdMap, transIdMap);
              }),
            );
          }),
        );
      }),
      map(() => void 0),
    );
  }

  private cloneNode(defId: string, targetVersionId: string, n: WorkflowNodeDto) {
    return this.nodesApi.create(defId, targetVersionId, {
      nodeKey: n.nodeKey,
      name: n.name,
      description: n.description ?? undefined,
      type: n.type,
      formId: n.formId ?? undefined,
      formVersionId: n.formVersionId ?? undefined,
      configuration: n.configuration ?? undefined,
      position: n.position,
    });
  }

  private mapIdsByKey<T extends { id: string }, U extends { id: string }>(
    source: T[],
    created: U[],
  ): Map<string, string> {
    const map = new Map<string, string>();
    source.forEach((oldItem, index) => {
      const newItem = created[index];
      if (newItem) {
        map.set(oldItem.id, newItem.id);
      }
    });
    return map;
  }

  private cloneWorkflowActions(
    actions: WorkflowActionDto[],
    nodeIdMap: Map<string, string>,
    transIdMap: Map<string, string>,
  ): Observable<void> {
    if (actions.length === 0) {
      return of(void 0);
    }
    const creates = actions
      .map((a) => {
        const workflowNodeId = a.workflowNodeId ? nodeIdMap.get(a.workflowNodeId) : undefined;
        const workflowTransitionId = a.workflowTransitionId
          ? transIdMap.get(a.workflowTransitionId)
          : undefined;
        if (a.workflowNodeId && !workflowNodeId) {
          return null;
        }
        if (a.workflowTransitionId && !workflowTransitionId) {
          return null;
        }
        return this.workflowActionsApi.create({
          workflowNodeId,
          workflowTransitionId,
          actionDefinitionId: a.actionDefinitionId,
          event: a.event ?? undefined,
          configuration: a.configuration ?? undefined,
          sequence: a.sequence,
          active: a.active,
        });
      })
      .filter((x): x is ReturnType<WorkflowActionsApiService['create']> => x !== null);

    if (creates.length === 0) {
      return of(void 0);
    }
    return forkJoin(creates).pipe(map(() => void 0));
  }

  create(input: Partial<WorkflowDefinition>): Observable<WorkflowDefinition> {
    return this.definitionsApi.create({
      workflowKey: input.code ?? 'NEW_' + Date.now().toString().slice(-6),
      name: input.name ?? 'Untitled workflow',
      description: input.description,
      active: true
    }).pipe(
      switchMap(def => {
        return this.versionsApi.create(def.id, {}).pipe(
          switchMap(ver => {
            return this.get(def.id, ver.version) as Observable<WorkflowDefinition>;
          })
        );
      })
    );
  }

  versions(id: string): Observable<WorkflowDefinition[]> {
    // To properly map versions to definitions in the frontend
    return this.definitionsApi.findOne(id).pipe(
      switchMap(def => {
        return this.versionsApi.findAll(def.id).pipe(
          map(versions => {
            return versions.map(v => ({
              id: def.id,
              code: def.workflowKey,
              name: def.name,
              description: def.description || undefined,
              version: v.version,
              status: v.status === 'PUBLISHED' ? 'published' : v.status === 'ARCHIVED' ? 'retired' : 'draft',
              tenantId: def.organizationId,
              entityType: 'case',
              nodes: [],
              transitions: [],
              variables: [],
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
            } as WorkflowDefinition)).sort((a, b) => b.version - a.version);
          })
        );
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.definitionsApi.remove(id).pipe(map(() => void 0));
  }
}
