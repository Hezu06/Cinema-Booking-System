import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailService } from "../../business/interfaces/email.interface.js";

export class NodeMailerGateway implements EmailService {
    private transporter: Transporter | null = null;
    private readonly isConfigured: boolean = false;

    constructor() {
        const user = process.env.SMTP_USER?.trim();
        // Remove spaces commonly copied from Google App Password displays (e.g. "abcd efgh ijkl mnop")
        const pass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();
        let host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
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
            });
            this.isConfigured = true;
        }
    }

    async sendVerificationEmail(to: string, name: string, otpCode: string): Promise<boolean> {
        const user = process.env.SMTP_USER?.trim();
        const from = process.env.EMAIL_FROM || (user ? `"Sọt Phim Cinema" <${user}>` : '"Sọt Phim Cinema" <no-reply@sotphim.vn>');
        const subject = `[Sọt Phim] Mã xác thực tài khoản của bạn: ${otpCode}`;

        if (!this.isConfigured || !this.transporter) {
            // Development/Fallback mode: Output OTP code prominently in server logs
            console.log("\n=======================================================");
            console.log("📧 [EMAIL GATEWAY - DEV / SIMULATION MODE]");
            console.log(`To: ${to} (${name})`);
            console.log(`Subject: ${subject}`);
            console.log(`🔑 MÃ XÁC THỰC (OTP CODE): ${otpCode}`);
            console.log("Thời hạn hiệu lực: 15 phút");
            console.log("Cấu hình SMTP_USER và SMTP_PASS trong file .env để gửi email thật qua SMTP.");
            console.log("=======================================================\n");
            return true;
        }

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

        try {
            await this.transporter.sendMail({
                from,
                to,
                subject,
                text: `Xin chào ${name},\nMã xác thực tài khoản Sọt Phim của bạn là: ${otpCode} (hiệu lực 15 phút).\nVui lòng không chia sẻ mã này cho bất kỳ ai.`,
                html,
            });
            console.log(`✅ Verification email successfully sent via SMTP to: ${to}`);
            return true;
        } catch (error) {
            console.error("❌ Failed to send verification email via SMTP:", error instanceof Error ? error.message : error);
            console.log(`🔑 [FALLBACK LOG] Mã OTP cho ${to}: ${otpCode}`);
            return false;
        }
    }
}

export const emailService = new NodeMailerGateway();
