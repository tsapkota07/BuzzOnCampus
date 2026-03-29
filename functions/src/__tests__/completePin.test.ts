import { HttpsError } from 'firebase-functions/v2/https'

// --- completePin logic (extracted for unit testing) ---

type PinType = 'event' | 'volunteer' | 'help' | 'business'

interface PinData {
  status: 'active' | 'completed' | 'cancelled'
  type: PinType
  user_id: string
  buzz_reward: number
}

interface UserData {
  buzz_balance: number
}

function completePinLogic(
  callerId: string,
  pin: PinData | null,
  callerBalance: number,
  creatorBalance: number
): {
  receiverId: string
  senderId: string | null
  amount: number
  newReceiverBalance: number
  newSenderBalance: number | null
} {
  if (!pin) throw new HttpsError('not-found', 'Pin not found.')
  if (pin.status !== 'active') throw new HttpsError('failed-precondition', 'Pin is not active.')

  const amount = pin.buzz_reward
  const receiverId = callerId
  const senderId = pin.type === 'help' ? pin.user_id : null

  if (senderId) {
    if (creatorBalance < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient Buzz Points.')
    }
  }

  return {
    receiverId,
    senderId,
    amount,
    newReceiverBalance: callerBalance + amount,
    newSenderBalance: senderId !== null ? creatorBalance - amount : null,
  }
}

// -------------------------------------------------------

describe('completePinLogic', () => {
  const callerId = 'user-abc'
  const creatorId = 'user-creator'

  describe('volunteer/event pin', () => {
    const volunteerPin: PinData = {
      status: 'active',
      type: 'volunteer',
      user_id: creatorId,
      buzz_reward: 10,
    }

    it('awards buzz to caller, no deduction from creator', () => {
      const result = completePinLogic(callerId, volunteerPin, 20, 50)
      expect(result.receiverId).toBe(callerId)
      expect(result.senderId).toBeNull()
      expect(result.newReceiverBalance).toBe(30)
      expect(result.newSenderBalance).toBeNull()
    })
  })

  describe('help pin', () => {
    const helpPin: PinData = {
      status: 'active',
      type: 'help',
      user_id: creatorId,
      buzz_reward: 15,
    }

    it('awards buzz to caller and deducts from creator', () => {
      const result = completePinLogic(callerId, helpPin, 20, 50)
      expect(result.receiverId).toBe(callerId)
      expect(result.senderId).toBe(creatorId)
      expect(result.newReceiverBalance).toBe(35)
      expect(result.newSenderBalance).toBe(35)
    })

    it('throws if creator has insufficient balance', () => {
      expect(() => completePinLogic(callerId, helpPin, 20, 10))
        .toThrow(expect.objectContaining({ code: 'failed-precondition', message: expect.stringContaining('Insufficient') }))
    })

    it('allows exact balance payment', () => {
      const result = completePinLogic(callerId, helpPin, 0, 15)
      expect(result.newSenderBalance).toBe(0)
    })
  })

  it('throws not-found when pin is missing', () => {
    expect(() => completePinLogic(callerId, null, 20, 50))
      .toThrow(expect.objectContaining({ code: 'not-found' }))
  })

  it('throws failed-precondition when pin is completed', () => {
    const completedPin: PinData = { status: 'completed', type: 'event', user_id: creatorId, buzz_reward: 10 }
    expect(() => completePinLogic(callerId, completedPin, 20, 50))
      .toThrow(expect.objectContaining({ code: 'failed-precondition' }))
  })

  it('throws failed-precondition when pin is cancelled', () => {
    const cancelledPin: PinData = { status: 'cancelled', type: 'event', user_id: creatorId, buzz_reward: 10 }
    expect(() => completePinLogic(callerId, cancelledPin, 20, 50))
      .toThrow(expect.objectContaining({ code: 'failed-precondition' }))
  })
})
