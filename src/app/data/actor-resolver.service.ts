import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActorResolver {
  resolveUserOrRoles(actorId: string): string[] {
    return [actorId];
  }
}
