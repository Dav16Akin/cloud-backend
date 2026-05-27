import { generateOTP, saveOTP } from "./otp";
import { sendOTPEmail } from "./sendOTPEmail";

export const handleSendOTP = async (userId: string, email: string) => {
  const code = generateOTP();
  await saveOTP(userId, code);
  await sendOTPEmail(email, code);
};
