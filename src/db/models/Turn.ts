import { model, Schema } from 'mongoose'

export enum TurnStatus {
  waiting = 'Kutilmoqda',
  called = 'Chaqirildi',
  deleted = 'O‘chirildi',
}

interface ITurn {
  user_id: number
  value: number
  status: TurnStatus
  message_id?: number
}

const schema = new Schema<ITurn>({
  user_id: Number,
  value: Number,
  status: {
    enum: [TurnStatus.waiting, TurnStatus.called, TurnStatus.deleted],
  },
  message_id: Number,
})

export const Turn = model<ITurn>('Turn', schema)
