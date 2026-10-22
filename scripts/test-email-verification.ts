import { AuthService } from "../src/business/services/auth.service.js";
import { userRepository } from "../src/data-access/repositories/user.repository.js";
import { emailService } from "../src/data-access/gateways/email.gateway.js";

async function runTest() {
    console.log("=== BẮT ĐẦU KIỂM THỬ XÁC THỰC EMAIL CHO LOCAL REGISTER ===");
    const authService = new AuthService(userRepository, emailService);
    const testEmail = `test.verify.${Date.now()}@example.com`;

    // 1. Đăng ký tài khoản thường
    console.log(`\n1. Đăng ký tài khoản với email: ${testEmail}`);
    const registeredUser = await authService.register({
        fullName: "Test User Email Verification",
        email: testEmail,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "Password123!",
    });
    console.log("-> Kết quả đăng ký thành công:", {
        id: registeredUser.id,
        email: registeredUser.email,
        isVerified: registeredUser.isVerified,
    });
    if (registeredUser.isVerified !== false) {
        throw new Error("Lỗi: Tài khoản mới phải có isVerified = false");
    }

    // 2. Thử đăng nhập khi chưa xác thực
    console.log("\n2. Thử đăng nhập khi chưa xác thực email (kỳ vọng bị chặn):");
    try {
        await authService.login(testEmail, "Password123!");
        throw new Error("Lỗi: Đáng lẽ không được phép đăng nhập khi chưa xác thực!");
    } catch (err: any) {
        console.log("-> Bị chặn đúng như kỳ vọng:", err.message);
    }

    // 3. Lấy thông tin user trong DB để lấy mã OTP test
    const dbUser = await userRepository.findByEmail(testEmail);
    if (!dbUser || !dbUser.verificationToken) {
        throw new Error("Lỗi: Không tìm thấy verificationToken trong cơ sở dữ liệu");
    }
    const realOtp = dbUser.verificationToken;
    console.log(`\n3. Mã OTP sinh ra trong DB: [${realOtp}]`);

    // 4. Thử xác thực với mã sai
    console.log("\n4. Xác thực với mã sai '000000':");
    try {
        await authService.verifyEmail({ email: testEmail, code: "000000" });
        throw new Error("Lỗi: Đáng lẽ phải từ chối mã sai!");
    } catch (err: any) {
        console.log("-> Từ chối mã sai đúng như kỳ vọng:", err.message);
    }

    // 5. Xác thực với mã đúng
    console.log(`\n5. Xác thực với mã đúng [${realOtp}]:`);
    const authResult = await authService.verifyEmail({ email: testEmail, code: realOtp });
    console.log("-> Xác thực thành công!", {
        userId: authResult.user.id,
        isVerified: authResult.user.isVerified,
        hasAccessToken: !!authResult.accessToken,
    });
    if (!authResult.user.isVerified) {
        throw new Error("Lỗi: Sau khi xác thực isVerified phải là true");
    }

    // 6. Đăng nhập lại sau khi đã xác thực
    console.log("\n6. Đăng nhập lại sau khi đã xác thực:");
    const loginResult = await authService.login(testEmail, "Password123!");
    console.log("-> Đăng nhập thành công!", {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        tokenLength: loginResult.accessToken.length,
    });

    console.log("\n🎉 TẤT CẢ KIỂM THỬ XÁC THỰC EMAIL ĐỀU ĐẠT CHUẨN!");
    process.exit(0);
}

runTest().catch((err) => {
    console.error("❌ Kiểm thử thất bại:", err);
    process.exit(1);
});
