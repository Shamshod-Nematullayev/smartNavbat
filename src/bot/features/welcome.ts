import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Turn, TurnStatus } from '#root/db/models/Turn.js'
import { User } from '#root/db/models/User.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), async (ctx) => {
  const user = await User.findOne({ id: ctx.from.id })

  if (!user) {
    return ctx.reply(ctx.t('welcome-new-user'), {
      reply_markup: {
        keyboard: [
          [{ text: ctx.t('share-number'), request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
  }

  let existingTurn = await Turn.findOne({ user_id: ctx.from.id })
  let turn = 1
  if (!existingTurn) {
    const lastTurn = (await Turn.find({ }).sort({ value: -1 }).limit(1))[0]
    let turn = 1
    if (lastTurn) {
      turn = lastTurn.value + 1
    }

    existingTurn = await Turn.create({
      user_id: ctx.from.id,
      value: turn,
    })
  }
  else {
    turn = existingTurn.value
  }
  const waitingTurnsCount = await Turn.countDocuments({ status: TurnStatus.waiting, value: {
    $lt: turn,
  } })

  const msg = await ctx.reply(ctx.t('welcome', { name: ctx.from.first_name, turn, beforeOrderCount: waitingTurnsCount }))
  await existingTurn.updateOne({ $set: { message_id: msg.message_id } })
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

  const lastTurn = (await Turn.find({ }).sort({ value: -1 }).limit(1))[0]
  let turn = 1
  if (lastTurn) {
    turn = lastTurn.value + 1
  }

  const newTurn = await Turn.create({
    user_id: ctx.from.id,
    value: turn,
  })

  const waitingTurnsCount = await Turn.countDocuments({ status: TurnStatus.waiting, value: {
    $lt: turn,
  } })

  const msg = await ctx.reply(ctx.t('welcome', { name: ctx.from.first_name, turn, beforeOrderCount: waitingTurnsCount }))
  await newTurn.updateOne({ $set: { message_id: msg.message_id } })
})

feature.command('stop', logHandle('command-stop'), async (ctx, next) => {
  const turn = await Turn.findOneAndDelete({ user_id: ctx.from.id })
  if (!turn)
    return await next()
  ctx.api.deleteMessage(ctx.chat.id, turn.message_id as number)
  return await ctx.reply(ctx.t('stop'))
})

export { composer as welcomeFeature }
