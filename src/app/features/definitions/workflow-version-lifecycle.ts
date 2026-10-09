import { WorkflowVersionStatus } from '../../data/api/api-models';

/** Backend: only DRAFT → publish. */
export function canPublishVersion(status: WorkflowVersionStatus): boolean {
  return status === 'DRAFT';
}

/** Backend: only PUBLISHED → archive. */
export function canArchiveVersion(status: WorkflowVersionStatus): boolean {
  return status === 'PUBLISHED';
}

export function isDraftVersion(status: WorkflowVersionStatus): boolean {
  return status === 'DRAFT';
}

export function versionStatusLabel(status: WorkflowVersionStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}

export function versionStatusChipClass(status: WorkflowVersionStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'wfe-chip-warn';
    case 'PUBLISHED':
      return 'wfe-chip-success';
    case 'ARCHIVED':
      return 'wfe-chip-neutral';
    default:
      return 'wfe-chip-neutral';
  }
}
