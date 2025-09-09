import type { Context } from '#root/bot/context.js'
import { Turn, TurnStatus } from '#root/db/models/Turn.js'

/**
 * Helper: Turn message yaratish yoki yangilash
 */
export async function sendOrUpdateTurnMessage(ctx: Context, userId: number) {
  let turnDoc = await Turn.findOne({ user_id: userId })
  let turn = 1

  if (!turnDoc) {
    const lastTurn = await Turn.findOne().sort({ value: -1 })
    turn = lastTurn ? lastTurn.value + 1 : 1

    turnDoc = await Turn.create({ user_id: userId, value: turn })
  }
  else {
    turn = turnDoc.value
  }

  const waitingTurnsCount = await Turn.countDocuments({
    status: TurnStatus.waiting,
    value: { $lt: turn },
  })

  // Eski xabarni o'chirib tashlaymiz
  if (turnDoc.message_id) {
    try {
      await ctx.api.deleteMessage(ctx.chat?.id as number, turnDoc.message_id)
    }
    catch {
      /* agar xabar allaqachon o'chgan bo‘lsa - e'tibor bermaymiz */
    }
  }

  const msg = await ctx.reply(
    ctx
      .t('welcome', {
        name: ctx.from?.first_name as string,
        turn,
        beforeOrderCount: waitingTurnsCount,
      })
      .replaceAll('<br>', '\n'),
    { reply_markup: { remove_keyboard: true } },
  )

  await turnDoc.updateOne({ $set: { message_id: msg.message_id } })
}
