import { model, Schema } from 'mongoose'

interface IUser {
  id: number
  phone: string
  first_name: string
  last_name: string
}

const schema = new Schema<IUser>({
  id: Number,
  phone: String,
  first_name: String,
  last_name: String,
})

export const User = model<IUser>('User', schema)
