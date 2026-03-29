export class Resend {
  emails = {
    send: jest.fn().mockResolvedValue({ error: null }),
  }
}
