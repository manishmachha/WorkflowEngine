import { Component, input, signal } from '@angular/core';
import { HubOverviewTabComponent } from './tabs/hub-overview-tab.component';
import { HubVersionsTabComponent } from './tabs/hub-versions-tab.component';
import { HubStructureTabComponent } from './tabs/hub-structure-tab.component';
import { HubInstancesTabComponent } from './tabs/hub-instances-tab.component';
import { HubActionsTabComponent } from './tabs/hub-actions-tab.component';

type HubTab = 'overview' | 'versions' | 'structure' | 'instances' | 'actions';

@Component({
  selector: 'definition-hub-tabs',
  standalone: true,
  imports: [
    HubOverviewTabComponent,
    HubVersionsTabComponent,
    HubStructureTabComponent,
    HubInstancesTabComponent,
    HubActionsTabComponent,
  ],
  template: `
    <nav class="wfe-hub-tabs" aria-label="Workflow hub sections">
      @for (t of tabs; track t.id) {
        <button
          type="button"
          class="wfe-hub-tab"
          [class.active]="active() === t.id"
          (click)="active.set(t.id)"
          [title]="t.label"
        >
          <i class="bi {{ t.icon }}"></i>
          <span class="tab-label">{{ t.label }}</span>
        </button>
      }
    </nav>

    @switch (active()) {
      @case ('overview') {
        <hub-overview-tab [definitionId]="definitionId()" />
      }
      @case ('versions') {
        <hub-versions-tab [definitionId]="definitionId()" />
      }
      @case ('structure') {
        <hub-structure-tab [definitionId]="definitionId()" />
      }
      @case ('instances') {
        <hub-instances-tab [definitionId]="definitionId()" />
      }
      @case ('actions') {
        <hub-actions-tab [definitionId]="definitionId()" />
      }
    }
  `,
})
export class DefinitionHubTabsComponent {
  definitionId = input.required<string>();
  active = signal<HubTab>('overview');

  tabs: { id: HubTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'bi-house-door' },
    { id: 'versions', label: 'Versions', icon: 'bi-layers' },
    { id: 'structure', label: 'Structure', icon: 'bi-diagram-2' },
    { id: 'instances', label: 'Instances', icon: 'bi-collection-play' },
    { id: 'actions', label: 'Bound actions', icon: 'bi-lightning-charge' },
  ];
}
