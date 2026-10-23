import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailService } from "../../business/interfaces/email.interface.js";

export class NodeMailerGateway implements EmailService {
    private transporter: Transporter | null = null;
    private readonly isConfigured: boolean = false;

    constructor() {
        const user = process.env.SMTP_USER?.replace(/['"]/g, "").trim();
        // Remove spaces commonly copied from Google App Password displays (e.g. "abcd efgh ijkl mnop")
        const pass = process.env.SMTP_PASS?.replace(/\s+/g, "").replace(/['"]/g, "").trim();
        let host = process.env.SMTP_HOST?.replace(/['"]/g, "").trim() || "smtp.gmail.com";
        // Auto-fix if user typed "smtp.com", "gmail.com", or "smtp.google.com" instead of "smtp.gmail.com"
        if ((host === "smtp.com" || host === "gmail.com" || host === "smtp.google.com") && (user?.includes("gmail") || user?.endsWith("@gmail.com"))) {
            host = "smtp.gmail.com";
        }
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === "true" || port === 465;

        if (user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 5000,
            });
            this.isConfigured = true;
        }
    }

    private async sendMailInternal({
        to,
        name,
        subject,
        html,
        text,
        otpCode,
        typeLabel,
    }: {
        to: string;
        name: string;
        subject: string;
        html: string;
        text: string;
        otpCode: string;
        typeLabel: string;
    }): Promise<boolean> {
        const user = process.env.SMTP_USER?.replace(/['"]/g, "").trim();
        const from = process.env.EMAIL_FROM || (user ? `"Sọt Phim Cinema" <${user}>` : '"Sọt Phim Cinema" <no-reply@sotphim.vn>');

        // 1. Check HTTP-based Email APIs first (Render Free blocks SMTP ports 25, 465, 587, but allows HTTPS port 443)
        const resendApiKey = process.env.RESEND_API_KEY?.replace(/['"]/g, "").trim();
        if (resendApiKey) {
            try {
                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${resendApiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM || "Sọt Phim Cinema <onboarding@resend.dev>",
                        to: [to],
                        subject,
                        html,
                    }),
                });
                if (res.ok) {
                    console.log(`✅ [${typeLabel}] Email successfully sent via Resend API (HTTPS) to: ${to}`);
                    return true;
                }
                const errData = await res.json().catch(() => ({}));
                console.error(`❌ Resend API error (${typeLabel}):`, errData);
            } catch (err) {
                console.error(`❌ Failed to send via Resend API (${typeLabel}):`, err);
            }
        }

        const brevoApiKey = process.env.BREVO_API_KEY?.replace(/['"]/g, "").trim();
        if (brevoApiKey) {
            try {
                const senderEmail = process.env.BREVO_SENDER?.replace(/['"]/g, "").trim() || user || "hyo.trng@gmail.com";
                const res = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "api-key": brevoApiKey,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify({
                        sender: { name: "Sọt Phim Cinema", email: senderEmail },
                        to: [{ email: to, name }],
                        subject,
                        htmlContent: html,
                    }),
                });
                if (res.ok) {
                    console.log(`✅ [${typeLabel}] Email successfully sent via Brevo API (HTTPS) to: ${to}`);
                    return true;
                }
                const errData = await res.json().catch(() => ({}));
                console.error(`❌ Brevo API error (${typeLabel}):`, errData);
            } catch (err) {
                console.error(`❌ Failed to send via Brevo API (${typeLabel}):`, err);
            }
        }

        // 2. Fallback to NodeMailer SMTP if configured
        if (this.isConfigured && this.transporter) {
            try {
                await this.transporter.sendMail({
                    from,
                    to,
                    subject,
                    text,
                    html,
                });
                console.log(`✅ [${typeLabel}] Email successfully sent via SMTP to: ${to}`);
                return true;
            } catch (error) {
                console.error(`❌ Failed to send ${typeLabel} email via SMTP:`, error instanceof Error ? error.message : error);
                console.log(`🔑 [FALLBACK LOG] Mã OTP ${typeLabel} cho ${to}: ${otpCode}`);
                return false;
            }
        }

        // 3. Fallback / Dev Mode
        console.log("\n=======================================================");
        console.log(`📧 [EMAIL GATEWAY - ${typeLabel.toUpperCase()} - DEV / SIMULATION MODE]`);
        console.log(`To: ${to} (${name})`);
        console.log(`Subject: ${subject}`);
        console.log(`🔑 MÃ XÁC THỰC (OTP CODE): ${otpCode}`);
        console.log("Thời hạn hiệu lực: 15 phút");
        console.log("=======================================================\n");
        return true;
    }

    async sendVerificationEmail(to: string, name: string, otpCode: string): Promise<boolean> {
        const subject = `[Sọt Phim] Mã xác thực tài khoản của bạn: ${otpCode}`;
        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #101016; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #282838;">
            <div style="background-color: #161622; padding: 28px 24px; text-align: center; border-bottom: 1px solid #282838;">
                <h1 style="margin: 0; color: #fcfc65; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">🍿 SỌT PHIM CINEMA</h1>
            </div>
            <div style="padding: 36px 28px;">
                <h2 style="margin-top: 0; margin-bottom: 12px; color: #ffffff; font-size: 20px; font-weight: 700;">Xác thực tài khoản của bạn</h2>
                <p style="color: #8e8e9e; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    Xin chào <strong style="color: #ffffff;">${name}</strong>,<br/>
                    Cảm ơn bạn đã lựa chọn trải nghiệm điện ảnh tại Sọt Phim. Để bảo mật tài khoản và kích hoạt đầy đủ quyền đặt vé, vui lòng nhập mã xác thực 6 chữ số dưới đây:
                </p>
                <div style="margin: 32px 0; text-align: center;">
                    <div style="display: inline-block; background-color: #181824; border: 2px dashed #fcfc65; border-radius: 14px; padding: 18px 36px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fcfc65; font-family: monospace;">${otpCode}</span>
                    </div>
                </div>
                <p style="color: #656578; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                    ⏱️ Mã xác thực này có hiệu lực trong vòng <strong>15 phút</strong>.
                </p>
                <p style="color: #656578; font-size: 12px; line-height: 1.5;">
                    ⚠️ Vì lý do an toàn, vui lòng không cung cấp mã này cho bất kỳ ai khác. Nếu bạn không thực hiện đăng ký tài khoản, vui lòng bỏ qua thư này.
                </p>
            </div>
            <div style="background-color: #161622; padding: 20px 24px; text-align: center; font-size: 12px; color: #656578; border-top: 1px solid #282838;">
                © 2026 Sọt Phim Cinema System. All rights reserved.
            </div>
        </div>
        `;
        const text = `Xin chào ${name},\nMã xác thực tài khoản Sọt Phim của bạn là: ${otpCode} (hiệu lực 15 phút).\nVui lòng không chia sẻ mã này cho bất kỳ ai.`;

        return this.sendMailInternal({
            to,
            name,
            subject,
            html,
            text,
            otpCode,
            typeLabel: "VERIFY_ACCOUNT",
        });
    }

    async sendPasswordResetEmail(to: string, name: string, otpCode: string): Promise<boolean> {
        const subject = `[Sọt Phim] Yêu cầu đặt lại mật khẩu: ${otpCode}`;
        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #101016; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #282838;">
            <div style="background-color: #161622; padding: 28px 24px; text-align: center; border-bottom: 1px solid #282838;">
                <h1 style="margin: 0; color: #fcfc65; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">🍿 SỌT PHIM CINEMA</h1>
            </div>
            <div style="padding: 36px 28px;">
                <h2 style="margin-top: 0; margin-bottom: 12px; color: #ffffff; font-size: 20px; font-weight: 700;">Đặt lại mật khẩu tài khoản</h2>
                <p style="color: #8e8e9e; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    Xin chào <strong style="color: #ffffff;">${name}</strong>,<br/>
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Sọt Phim của bạn. Vui lòng nhập mã xác thực 6 chữ số dưới đây để thiết lập mật khẩu mới:
                </p>
                <div style="margin: 32px 0; text-align: center;">
                    <div style="display: inline-block; background-color: #181824; border: 2px dashed #fcfc65; border-radius: 14px; padding: 18px 36px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fcfc65; font-family: monospace;">${otpCode}</span>
                    </div>
                </div>
                <p style="color: #656578; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                    ⏱️ Mã đặt lại mật khẩu này có hiệu lực trong vòng <strong>15 phút</strong>.
                </p>
                <p style="color: #656578; font-size: 12px; line-height: 1.5;">
                    ⚠️ Vì lý do an toàn, vui lòng không cung cấp mã này cho bất kỳ ai khác. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư - tài khoản của bạn vẫn được an toàn.
                </p>
            </div>
            <div style="background-color: #161622; padding: 20px 24px; text-align: center; font-size: 12px; color: #656578; border-top: 1px solid #282838;">
                © 2026 Sọt Phim Cinema System. All rights reserved.
            </div>
        </div>
        `;
        const text = `Xin chào ${name},\nMã đặt lại mật khẩu tài khoản Sọt Phim của bạn là: ${otpCode} (hiệu lực 15 phút).\nVui lòng không chia sẻ mã này cho bất kỳ ai.`;

        return this.sendMailInternal({
            to,
            name,
            subject,
            html,
            text,
            otpCode,
            typeLabel: "RESET_PASSWORD",
        });
    }
}

export const emailService = new NodeMailerGateway();
