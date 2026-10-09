import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { InstancesApi } from '../../data/instances.api';
import { AuthStore } from '../../core/auth/auth.store';
import { WorkflowDefinition } from '../../domain/definition';
import { FormRendererHostComponent } from '../../shared/forms/form-renderer-host.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'start-instance-panel',
  standalone: true,
  imports: [FormRendererHostComponent],
  template: `
    <form-renderer-host
      formId="complaint-intake"
      [formVersion]="1"
      [initialValue]="{}"
      (submitted)="start($event)"
      (cancelled)="cancelled.emit()"
    />
  `,
})
export class StartInstancePanelComponent {
  def = input.required<WorkflowDefinition>();
  cancelled = output<void>();
  started = output<string>();

  private instances = inject(InstancesApi);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private router = inject(Router);

  start(payload: Record<string, unknown>) {
    const user = this.auth.user();
    if (!user) return;
    const d = this.def();
    this.instances.start(d.id, user.id, payload).subscribe((inst) => {
      if (inst) {
        this.toast.success(`Started ${inst.code}`);
        this.started.emit(inst.id);
        this.router.navigate(['/instances', inst.id], { queryParams: { defId: d.id } });
      }
    });
  }
}
