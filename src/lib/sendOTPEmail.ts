import { transporter } from "./mailer";

import { Resend } from "resend";

transporter.verify((error: any) => {
  if (error) {
    console.error("❌ Mail server connection failed:", error);
  } else {
    console.log("✅ Mail server connected");
  }
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email: string, code: string) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Your verification code",
    html: `
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};

// export const sendOTPEmail = async (email: string, code: string) => {
//   const info = await transporter.sendMail({
//     from: `"Nupat Cloud" <${process.env.SMTP_EMAIL}>`,
//     to: email,
//     subject: "Your verification code",
//     html: `
//       <p>Your verification code is:</p>
//       <h2>${code}</h2>
//       <p>This code expires in 10 minutes.</p>
//     `,
//   });

//   console.log("📧 Email sent:", info.messageId);
//   console.log("📬 Accepted:", info.accepted);
//   console.log("❌ Rejected:", info.rejected);
// };
