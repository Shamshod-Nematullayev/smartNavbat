import process from 'node:process'
import mongoose from 'mongoose'

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string)
    console.warn('✅ MongoDB ulandi')
  }
  catch (err) {
    console.error('❌ MongoDB ulanish xatosi:', err)
    process.exit(1)
  }
}
