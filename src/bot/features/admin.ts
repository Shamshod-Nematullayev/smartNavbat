import type { Context } from '#root/bot/context.js'
import { isAdmin } from '#root/bot/filters/is-admin.js'
import { setCommandsHandler } from '#root/bot/handlers/commands/setcommands.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Turn, TurnStatus } from '#root/db/models/Turn.js'
import { chatAction } from '@grammyjs/auto-chat-action'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private').filter(isAdmin)

feature.command(
  'setcommands',
  logHandle('command-setcommands'),
  chatAction('typing'),
  setCommandsHandler,
)

// Adminlar uchun buyruqlar ro'yxatini yuborish
feature.command('start', logHandle('command-admin-start'), async (ctx) => {
  ctx.reply(
    `/list - Navbatda turgan murojaatcilar ro'yxatini ko'rish\n\n/call - Keyingi mijozni chaqirish`,
  )
  setCommandsHandler(ctx)
})

// Navbatda turgan murojaatcilar ro'yxatini ko'rish
const PAGE_SIZE = 30
feature.command('list', logHandle('command-admin-list'), async (ctx) => {
  const turns = await Turn.find({ status: TurnStatus.waiting }).limit(
    PAGE_SIZE,
  )
  if (turns.length === 0)
    return ctx.reply(ctx.t('no-turns'))
  let message = ''

  for (const turn of turns) {
    message += `${turn.value}. ${turn.username}\n`
  }

  ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [[{ text: '➡️', callback_data: `getlist-${1}` }]],
    },
  })
})

// Navbatda turgan murojaatcilar ro'yxatini ko'rish PAGING
feature.callbackQuery(/getlist-(\d+)/, async (ctx) => {
  const page = Number.parseInt(ctx.callbackQuery.data.split('-')[1])
  const turns = await Turn.find({ status: TurnStatus.waiting })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
  let message = ''

  for (const turn of turns) {
    message += `${turn.value}. ${turn.username}\n`
  }

  const buttons = []

  if (page > 1) {
    buttons.push({ text: '⬅️', callback_data: `getlist-${page - 1}` })
  }

  if (turns.length === PAGE_SIZE) {
    buttons.push({ text: '➡️', callback_data: `getlist-${page + 1}` })
  }

  ctx.editMessageText(message, {
    reply_markup: {
      inline_keyboard: [buttons],
    },
  })
})

feature.command('call', logHandle('command-admin-call'), async (ctx) => {
  const currentTurn = await Turn.findOne({
    status: TurnStatus.called,
    admin_id: ctx.from.id,
  })
  if (currentTurn) {
    await currentTurn.updateOne({ status: TurnStatus.deleted, admin_id: null })
    await ctx.api.sendMessage(
      currentTurn.user_id,
      ctx.t('call-deleted').replaceAll('<br>', '\n'),
    )
  }
  const turns = await Turn.find({ status: TurnStatus.waiting }).sort({
    value: 1,
  })
  const turn = turns[0]

  if (!turn) {
    return ctx.reply(ctx.t('no-turns'))
  }

  await ctx.api.sendMessage(
    turn.user_id,
    ctx.t('calling', {
      adminNumber: (ctx.config.botAdmins.indexOf(ctx.from.id) + 1).toString(),
    }),
  )

  try {
    await ctx.api.deleteMessage(turn.user_id, turn.message_id as number)
  }
  catch {
    /* allaqachon o'chgan bo'lsa e'tibor bermaymiz */
  }

  ctx.reply(
    ctx
      .t('call-sent', {
        username: turn.username,
        user_id: turn.user_id,
      })
      .replaceAll('<br>', '\n'),
  )

  await turn.updateOne({ status: TurnStatus.called, admin_id: ctx.from.id })
})

export { composer as adminFeature }
