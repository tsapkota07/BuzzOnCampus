// BuzzOnCampus — Firebase Cloud Functions
// Owner: Tirsan
// All exports from sub-modules are registered here

// validateEduEmail disabled — requires Identity Platform (GCIP)
// Client-side domain validation + OTP covers this sufficiently
export { onUserCreated } from './auth/onUserCreated'
export { sendOtp } from './auth/sendOtp'
export { verifyOtp } from './auth/verifyOtp'
export { completePin } from './pins/completePin'
export { getFeed } from './feed/getFeed'
export { approveVolunteerHours } from './admin/approveVolunteerHours'
