import assert from "node:assert/strict";
import { VnpayGateway } from "../src/data-access/gateways/vnpay.gateway.js";

const gateway = new VnpayGateway({
  tmnCode: "TESTCODE",
  hashSecret: "sandbox-test-secret",
  paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: "https://example.test/api/payments/vnpay/return",
});

const url = new URL(gateway.createPaymentUrl({
  txnRef: "PAY-TEST-001",
  amount: 150_000,
  orderInfo: "Thanh toan booking BK-TEST",
  ipAddress: "127.0.0.1",
  expireAt: new Date(Date.now() + 10 * 60 * 1000),
}));

const params = Object.fromEntries(url.searchParams.entries());
assert.equal(params.vnp_Amount, "15000000");
assert.equal(params.vnp_TmnCode, "TESTCODE");
assert.match(params.vnp_CreateDate ?? "", /^\d{14}$/);
assert.equal(gateway.verifyCallback(params), true);

const tampered = { ...params, vnp_Amount: "100" };
assert.equal(gateway.verifyCallback(tampered), false);

console.log("VNPAY signing tests passed");
