import type { Context } from '#root/bot/context.js'

export function isAdmin(ctx: Context): boolean {
  return !!ctx.from && ctx.config.botAdmins.includes(ctx.from.id)
}
