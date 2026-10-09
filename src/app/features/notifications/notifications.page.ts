import { Component, inject } from '@angular/core';

@Component({
  selector: 'notifications-page',
  standalone: true,
  template: `
    <div class="wfe-page">
      <h1 class="wfe-page-title">Notifications</h1>
      <p>Notifications loading from backend...</p>
    </div>
  `
})
export class NotificationsPage {
}
