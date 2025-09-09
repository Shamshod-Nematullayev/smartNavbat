import type { Context } from '#root/bot/context.js'
import type { LanguageCode } from '@grammyjs/types'
import type { CommandContext } from 'grammy'
import { i18n } from '#root/bot/i18n.js'
import { Command, CommandGroup } from '@grammyjs/commands'

function addCommandLocalizations(command: Command) {
  i18n.locales.forEach((locale) => {
    command.localize(
      locale as LanguageCode,
      command.name,
      i18n.t(locale, `${command.name}.description`),
    )
  })
  return command
}

function addCommandToChats(command: Command, chats: number[]) {
  for (const chatId of chats) {
    command.addToScope({
      type: 'chat',
      chat_id: chatId,
    })
  }
}

export async function setCommandsHandler(ctx: CommandContext<Context>) {
  const start = new Command(
    'start',
    i18n.t('uz', 'start.description'),
  ).addToScope({ type: 'all_private_chats' })
  addCommandLocalizations(start)
  addCommandToChats(start, ctx.config.botAdmins)

  const list = new Command('list', i18n.t('uz', 'list.description')).addToScope(
    { type: 'all_private_chats' },
  )
  addCommandLocalizations(list)
  addCommandToChats(list, ctx.config.botAdmins)

  const call = new Command('call', i18n.t('uz', 'call.description')).addToScope(
    { type: 'all_private_chats' },
  )
  addCommandLocalizations(call)
  addCommandToChats(call, ctx.config.botAdmins)

  const commands = new CommandGroup().add(start).add(list).add(call)

  await commands.setCommands(ctx)

  return ctx.reply(ctx.t('admin-commands-updated'))
}
