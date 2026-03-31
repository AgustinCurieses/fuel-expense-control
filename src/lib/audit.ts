import { prisma } from './database'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPORT_EXCEL'
  | 'ASSIGN_CARD'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DEACTIVATE_USER'
  | 'SAVE_FACTURA_TOTAL'

export async function logAction(params: {
  userId?: string
  userEmail?: string
  action: AuditAction
  entity?: string
  entityId?: string
  detail?: object
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        detail: params.detail ? JSON.stringify(params.detail) : null
      }
    })
  } catch {
    // Audit failures should never break the main flow
  }
}
