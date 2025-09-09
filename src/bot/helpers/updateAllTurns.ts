import type { Context } from '#root/bot/context.js'
import { Turn, TurnStatus } from '#root/db/models/Turn.js'

export async function updateAllTurns(ctx: Context) {
  const turns = await Turn.find({ status: TurnStatus.waiting }).sort({
    value: 1,
  })

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i]
    const beforeOrderCount = i // i = oldinda turganlar soni
    const user = await ctx.api.getChat(t.user_id).catch(() => null)
    if (!user)
      continue

    try {
      // Eski xabarni o‘chirib tashlaymiz (agar mavjud bo‘lsa)
      if (t.message_id) {
        await ctx.api.deleteMessage(t.user_id, t.message_id).catch(() => {})
      }

      // Yangi xabar jo‘natamiz
      const msg = await ctx.api.sendMessage(
        t.user_id,
        ctx
          .t('welcome', {
            name: user.first_name || '',
            turn: t.value,
            beforeOrderCount,
          })
          .replaceAll('<br>', '\n'),
        { parse_mode: 'HTML' },
      )

      // Yangilangan message_id ni saqlab qo‘yamiz
      await Turn.updateOne(
        { _id: t._id },
        { $set: { message_id: msg.message_id } },
      )
    }
    catch (err) {
      console.error('Xabarni yangilashda xatolik:', err)
    }
  }
}
