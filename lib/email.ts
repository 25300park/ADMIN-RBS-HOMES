import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER,
    pass: process.env.NEXT_PUBLIC_EMAIL_APP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * 비밀번호 찾기 이메일 템플릿
 */
export function getPasswordResetEmailTemplate(tempPassword: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333;">RBS HOMES</h1>
      </div>
      
      <p style="color: #666; margin-bottom: 20px;">
        Hello, this is RBS HOMES.<br>
        We are sending you your temporary password as requested.
      </p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 15px;">Your Temporary Password:</h3>
        <div style="background-color: white; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-family: monospace;">
          ${tempPassword}
        </div>
      </div>
      
      <p style="color: #666; margin: 20px 0;">
        You can log in to RBS HOMES using this temporary password.<br>
        For security purposes, we recommend changing your password after logging in.
      </p>
      
      <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #999;">
        <p>This email was sent automatically. Please do not reply to this email.</p>
        <p>If you did not request a password reset, please contact our support team.</p>
        <p>&copy; 2024 RBS HOMES. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * 쪽지 + 이메일 발송용 통합 템플릿 (본사 공식 메일)
 */
export function getMessageEmailTemplate(
  senderName: string,
  messageTitle: string,
  messageContent: string,
  recipientName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <!-- 헤더 -->
      <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">RBS HOMES</h1>
      </div>
      
      <!-- 본문 -->
      <div style="background-color: white; padding: 20px 10px;">
        <p style="color: #333; margin-bottom: 5px; font-size: 14px;">
          Dear <strong>${recipientName}</strong>,
        </p>
        
        <!-- 메시지 내용 -->
        <div style="background-color: #f9f9f9; padding: 25px; border-left: 4px solid #0066cc; margin-bottom: 30px;">
          <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
            ${messageTitle}
          </h3>
          <div style="color: #555; line-height: 1.8; font-size: 14px;">
            ${messageContent}
          </div>
        </div>
        
        <!-- 버튼 -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rbs-homes.com/" 
             style="background-color: #0066cc; color: white; padding: 12px 35px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 14px;">
            Go website
          </a>
        </div>
        
      </div>
      
      <!-- 푸터 -->
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 11px; margin: 5px 0;">
          If you have any questions, please contact our support team.
        </p>
        <p style="color: #999; font-size: 11px; margin: 5px 0;">
          &copy; 2024 RBS HOMES. All rights reserved.
        </p>
      </div>
    </div>
  `;
}