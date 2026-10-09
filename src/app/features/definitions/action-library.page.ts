import { Component } from '@angular/core';
import { ActionDefinitionsPanelComponent } from '../admin/actions/action-definitions-panel.component';

@Component({
  selector: 'action-library-page',
  standalone: true,
  imports: [ActionDefinitionsPanelComponent],
  template: `
    <div class="wfe-page">
      <action-definitions-panel />
    </div>
  `,
})
export class ActionLibraryPage {}
