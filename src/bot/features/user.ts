import type { Context } from '#root/bot/context.js'
import { isAdmin } from '#root/bot/filters/is-admin.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { sendOrUpdateTurnMessage } from '#root/bot/helpers/sendOrUpdateTurnMessage.js'
import { updateAllTurns } from '#root/bot/helpers/updateAllTurns.js'
import { Turn } from '#root/db/models/Turn.js'
import { User } from '#root/db/models/User.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()
const feature = composer.chatType('private').filter(ctx => !isAdmin(ctx))

feature.command('start', logHandle('command-start'), async (ctx) => {
  const user = await User.findOne({ id: ctx.from.id })

  if (!user) {
    return ctx.reply(ctx.t('welcome-new-user'), {
      reply_markup: {
        keyboard: [[{ text: ctx.t('share-number'), request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
  }

  await sendOrUpdateTurnMessage(ctx, ctx.from.id)
})

feature.on(':contact', logHandle('contact'), async (ctx, next) => {
  const user = await User.findOne({ id: ctx.from.id })
  if (user)
    return next()

  await User.create({
    id: ctx.from.id,
    phone: ctx.message.contact.phone_number,
    first_name: ctx.message.contact.first_name,
    last_name: ctx.message.contact.last_name,
  })

  await sendOrUpdateTurnMessage(ctx, ctx.from.id)
})

feature.command('stop', logHandle('command-stop'), async (ctx, next) => {
  const turn = await Turn.findOneAndDelete({ user_id: ctx.from.id })
  if (!turn)
    return await next()

  if (turn.message_id) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, turn.message_id as number)
    }
    catch {
      /* allaqachon o'chgan bo'lsa e'tibor bermaymiz */
    }
  }

  ctx.reply(ctx.t('stop').replaceAll('<br>', '\n'))

  // Qolgan navbatdagilar uchun yangilash
  await updateAllTurns(ctx)
})

export { composer as userFeature }
