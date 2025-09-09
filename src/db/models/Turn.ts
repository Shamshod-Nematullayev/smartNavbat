import { model, Schema } from 'mongoose'

export enum TurnStatus {
  waiting = 'Kutilmoqda',
  called = 'Chaqirildi',
  deleted = 'O‘chirildi',
}

interface ITurn {
  user_id: number
  username: string
  value: number
  status: TurnStatus
  message_id?: number
  admin_id?: number
}

const schema = new Schema<ITurn>({
  user_id: Number,
  username: String,
  value: Number,
  status: {
    required: true,
    type: String,
    enum: [TurnStatus.waiting, TurnStatus.called, TurnStatus.deleted],
    default: TurnStatus.waiting,
  },
  message_id: Number,
  admin_id: Number,
})

export const Turn = model<ITurn>('Turn', schema)
