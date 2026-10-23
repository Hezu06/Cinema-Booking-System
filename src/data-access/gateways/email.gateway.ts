import type {
    BookingTicketEmailData,
    EmailService,
} from "../../business/interfaces/email.interface.js";

function formatVietnamDateTime(date: Date): string {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(date));
}

export class BrevoEmailGateway implements EmailService {
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
        otpCode?: string;
        typeLabel: string;
    }): Promise<boolean> {
        const brevoApiKey = process.env.BREVO_API_KEY?.replace(/['"]/g, "").trim();
        const senderEmail = process.env.BREVO_SENDER?.replace(/['"]/g, "").trim() || "hyo.trng@gmail.com";

        // 1. Send via Brevo HTTPS REST API (Cổng 443 HTTPS tương thích hoàn toàn Render Free)
        if (brevoApiKey) {
            try {
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
                        textContent: text,
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

        // 2. Fallback / Dev / Simulation Mode (Hiển thị trực quan trong console khi chưa có API key)
        console.log("\n=======================================================");
        console.log(`📧 [EMAIL GATEWAY - ${typeLabel.toUpperCase()} - DEV / SIMULATION MODE]`);
        console.log(`To: ${to} (${name})`);
        console.log(`Subject: ${subject}`);
        if (otpCode) {
            console.log(`🔑 MÃ XÁC THỰC (OTP CODE): ${otpCode}`);
            console.log("Thời hạn hiệu lực: 15 phút");
        }
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

    async sendBookingTicketEmail(data: BookingTicketEmailData): Promise<boolean> {
        const subject = `[Sọt Phim] Xác nhận đặt vé thành công - Mã vé: ${data.bookingCode}`;
        const formattedDateTime = formatVietnamDateTime(data.startTime);
        const formattedAmount = `${Number(data.totalAmount).toLocaleString("vi-VN")} đ`;
        const seatText = data.seatLabels.join(", ");

        const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #101016; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #282838;">
            <div style="background-color: #161622; padding: 26px 24px; text-align: center; border-bottom: 1px solid #282838;">
                <h1 style="margin: 0; color: #fcfc65; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">🍿 SỌT PHIM CINEMA</h1>
                <p style="margin: 8px 0 0; color: #4ade80; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">✓ XÁC NHẬN ĐẶT VÉ THÀNH CÔNG</p>
            </div>
            <div style="padding: 32px 28px;">
                <p style="color: #8e8e9e; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 22px;">
                    Xin chào <strong style="color: #ffffff;">${data.name}</strong>,<br/>
                    Cảm ơn bạn đã lựa chọn trải nghiệm điện ảnh tại Sọt Phim. Đơn đặt vé của bạn đã được thanh toán và xác nhận thành công!
                </p>

                <div style="background-color: #181824; border: 2px dashed #fcfc65; border-radius: 14px; padding: 18px 24px; text-align: center; margin-bottom: 26px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8e8e9e; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 600;">MÃ ĐẶT VÉ (BOOKING CODE)</span>
                    <span style="font-size: 30px; font-weight: 900; letter-spacing: 5px; color: #fcfc65; font-family: monospace;">${data.bookingCode}</span>
                </div>

                <div style="background-color: #161622; border: 1px solid #262638; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            ${data.moviePosterUrl ? `
                            <td style="width: 100px; vertical-align: top; padding-right: 18px;">
                                <img src="${data.moviePosterUrl}" alt="${data.movieTitle}" style="width: 100%; border-radius: 10px; border: 1px solid #282838; display: block;" />
                            </td>
                            ` : ""}
                            <td style="vertical-align: top;">
                                <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 800; line-height: 1.3;">${data.movieTitle}</h2>
                                <div style="font-size: 13px; color: #a0a0b2; line-height: 1.8;">
                                    <div>🏛️ <strong style="color: #d1d1e0;">Rạp chiếu:</strong> <span style="color: #ffffff;">${data.cinemaName}</span></div>
                                    <div>📍 <strong style="color: #d1d1e0;">Địa chỉ:</strong> <span>${data.cinemaAddress}</span></div>
                                    <div>🚪 <strong style="color: #d1d1e0;">Phòng chiếu:</strong> <span style="color: #ffffff;">${data.roomName}</span></div>
                                    <div>⏰ <strong style="color: #d1d1e0;">Suất chiếu:</strong> <span style="color: #fcfc65; font-weight: 700;">${formattedDateTime}</span></div>
                                    <div>🎟️ <strong style="color: #d1d1e0;">Ghế:</strong> <span style="color: #fcfc65; font-weight: 800; font-size: 15px;">${seatText}</span></div>
                                    <div>💵 <strong style="color: #d1d1e0;">Tổng thanh toán:</strong> <span style="color: #ffffff; font-weight: 700;">${formattedAmount}</span></div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin: 28px 0 24px;">
                    <a href="${data.ticketUrl}" style="display: inline-block; background-color: #fcfc65; color: #08080c; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(252, 252, 101, 0.35);">
                        XEM VÉ ĐIỆN TỬ & MÃ QR
                    </a>
                </div>

                <div style="background-color: #14141e; border: 1px solid #222232; border-radius: 12px; padding: 16px; font-size: 12px; color: #8e8e9e; line-height: 1.6;">
                    💡 <strong>Hướng dẫn nhận vé tại rạp:</strong><br/>
                    • Quý khách vui lòng xuất trình email này hoặc mở mã QR trong vé điện tử tại quầy vé / cổng soát vé của rạp.<br/>
                    • Khuyến nghị quý khách có mặt tại rạp trước giờ chiếu từ 15 – 20 phút để nhận bắp nước và ổn định chỗ ngồi.<br/>
                    • Chúc quý khách có những giây phút thưởng thức điện ảnh tuyệt vời tại Sọt Phim!
                </div>
            </div>
            <div style="background-color: #161622; padding: 20px 24px; text-align: center; font-size: 12px; color: #656578; border-top: 1px solid #282838;">
                © 2026 Sọt Phim Cinema System. All rights reserved.<br/>
                Hotline hỗ trợ: 1900 6868 | Email CSKH: cskh@sotphim.vn
            </div>
        </div>
        `;

        const text = `Xin chào ${data.name},\nĐơn đặt vé xem phim của bạn đã thành công!\n\nMã đặt vé: ${data.bookingCode}\nPhim: ${data.movieTitle}\nRạp: ${data.cinemaName} (${data.cinemaAddress})\nPhòng: ${data.roomName}\nSuất chiếu: ${formattedDateTime}\nGhế: ${seatText}\nTổng tiền: ${formattedAmount}\n\nXem vé điện tử tại: ${data.ticketUrl}\n\nVui lòng có mặt trước giờ chiếu 15-20 phút. Chúc bạn xem phim vui vẻ!`;

        return this.sendMailInternal({
            to: data.to,
            name: data.name,
            subject,
            html,
            text,
            typeLabel: "BOOKING_TICKET",
        });
    }
}

export const emailService = new BrevoEmailGateway();
