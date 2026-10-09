import { Component } from '@angular/core';
import { AdminShellComponent } from '../admin-shell.component';
import { ActionDefinitionsPanelComponent } from './action-definitions-panel.component';

@Component({
  selector: 'action-definitions-admin-page',
  standalone: true,
  imports: [AdminShellComponent, ActionDefinitionsPanelComponent],
  template: `
    <admin-shell />
    <div class="wfe-page">
      <action-definitions-panel />
    </div>
  `,
})
export class ActionDefinitionsAdminPage {}
