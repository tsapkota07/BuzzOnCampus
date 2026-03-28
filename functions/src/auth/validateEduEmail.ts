import { beforeUserCreated } from 'firebase-functions/v2/identity'

// Blocks registration if email is not a .edu address
export const validateEduEmail = beforeUserCreated(async (event) => {
  const email = event.data.email ?? ''
  if (!email.endsWith('.edu')) {
    throw new Error('Only .edu email addresses are allowed.')
  }
})
