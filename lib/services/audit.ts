import { storage } from '@/lib/db/adaptor';

export const audit = {
  async log(workspaceId: string, userId: string | null, entityType: string, entityId: string, action: string, oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null) {
    return storage.createAuditLog({
      workspace_id: workspaceId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue,
      new_value: newValue,
      metadata: null,
    });
  },
};
