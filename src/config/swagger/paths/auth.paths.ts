export const authPaths = {
  "/api/auth/register": {
    post: {
      tags: ["Auth"],

      summary:
        "Đăng ký tài khoản Customer mới",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/RegisterInput",
            },
          },
        },
      },

      responses: {
        201: {
          description:
            "Đăng ký thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RegisterResponse",
              },
            },
          },
        },

        400: {
          description:
            "Dữ liệu đăng ký không hợp lệ",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        409: {
          description:
            "Email hoặc số điện thoại đã được sử dụng",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        500: {
          description:
            "Lỗi hệ thống trong quá trình đăng ký",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/login": {
    post: {
      tags: ["Auth"],

      summary:
        "Đăng nhập và nhận JWT Access Token",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/LoginInput",
            },
          },
        },
      },

      responses: {
        200: {
          description:
            "Đăng nhập thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/LoginResponse",
              },
            },
          },
        },

        400: {
          description:
            "Dữ liệu đăng nhập không hợp lệ",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        401: {
          description:
            "Email hoặc mật khẩu không đúng",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        500: {
          description:
            "Lỗi hệ thống trong quá trình đăng nhập",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/google": {
    post: {
      tags: ["Auth"],
      summary: "Dang nhap hoac dang ky bang Google OAuth 2.0 (Google ID Token)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/GoogleAuthInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Dang nhap Google thanh cong",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginResponse",
              },
            },
          },
        },
        400: {
          description: "Du lieu xac thuc khong hop le",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        401: {
          description: "Google ID token khong hop le hoac da het han",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        500: {
          description: "Loi he thong khi xac thuc Google",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/me": {
    get: {
      tags: ["Auth"],

      summary:
        "Lấy thông tin người dùng hiện tại",

      security: [
        {
          BearerAuth: [],
        },
      ],

      responses: {
        200: {
          description:
            "Lấy thông tin người dùng thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MeResponse",
              },
            },
          },
        },

        401: {
          description:
            "Thiếu JWT hoặc JWT không hợp lệ",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        403: {
          description:
            "Tài khoản bị khóa",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        404: {
          description:
            "Không tìm thấy người dùng",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        500: {
          description:
            "Không thể lấy thông tin người dùng",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/protected": {
    get: {
      tags: ["Auth"],

      summary:
        "Endpoint kiểm tra JWT",

      security: [
        {
          BearerAuth: [],
        },
      ],

      responses: {
        200: {
          description:
            "JWT hợp lệ",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true,
                  },

                  message: {
                    type: "string",
                    example:
                      "Bạn đã đăng nhập",
                  },
                },
              },
            },
          },
        },

        401: {
          description:
            "JWT không tồn tại hoặc không hợp lệ",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        403: {
          description:
            "Tài khoản bị khóa",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Xác thực tài khoản qua mã OTP gửi về email",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/VerifyEmailInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Xác thực email thành công, trả về JWT",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginResponse",
              },
            },
          },
        },
        400: {
          description: "Mã OTP không đúng hoặc đã hết hạn",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        404: {
          description: "Tài khoản không tồn tại",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },

  "/api/auth/resend-verification": {
    post: {
      tags: ["Auth"],
      summary: "Gửi lại mã OTP xác thực tài khoản qua email",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResendVerificationInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Mã xác thực mới đã được gửi thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Mã xác thực mới đã được gửi tới email của bạn" },
                },
              },
            },
          },
        },
        429: {
          description: "Yêu cầu gửi lại quá nhanh (cooldown 60 giây)",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },
};