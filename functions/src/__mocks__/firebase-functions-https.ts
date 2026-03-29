export class HttpsError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'HttpsError'
  }
}

export const onCall = (handler: Function) => handler
