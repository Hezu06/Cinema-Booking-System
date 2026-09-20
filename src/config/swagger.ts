import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const port = process.env.PORT ?? 5000;

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Cinema Booking System API",
    version: "1.0.0",
    description: "Tài liệu API và công cụ kiểm thử tương tác cho hệ thống đặt vé xem phim Cinema Booking System.",
    contact: {
      name: "Cinema Booking System Team",
    },
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: `Môi trường hiện tại (Port ${port})`,
    },
    {
      url: "http://localhost:5000",
      description: "Docker Container (Port 5000)",
    },
    {
      url: "http://localhost:3000",
      description: "Local Node.js Development (Port 3000)",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập JWT token được tạo ra sau khi đăng nhập (không cần gõ tiền tố 'Bearer ')",
      },
    },
    schemas: {
      MovieStatus: {
        type: "string",
        enum: ["COMING_SOON", "NOW_SHOWING", "ENDED"],
        example: "NOW_SHOWING",
      },
      UserRole: {
        type: "string",
        enum: ["USER", "ADMIN"],
        example: "USER",
      },
      UserStatus: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE", "BANNED"],
        example: "ACTIVE",
      },
      Movie: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "64162d7a-3491-4e80-945f-771476fbc7e3" },
          title: { type: "string", example: "Interstellar" },
          description: { type: "string", example: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
          durationMinutes: { type: "integer", example: 169 },
          genre: { type: "string", example: "Sci-Fi" },
          releaseDate: { type: "string", format: "date-time", example: "2026-10-20T00:00:00.000Z" },
          posterUrl: { type: "string", format: "uri", example: "https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
          status: { $ref: "#/components/schemas/MovieStatus" },
        },
      },
      CreateMovieInput: {
        type: "object",
        required: ["title", "description", "durationMinutes", "genre", "releaseDate", "posterUrl", "status"],
        properties: {
          title: { type: "string", example: "Inception" },
          description: { type: "string", example: "A thief who steals corporate secrets through dream-sharing technology." },
          durationMinutes: { type: "integer", minimum: 1, example: 148 },
          genre: { type: "string", example: "Sci-Fi" },
          releaseDate: { type: "string", format: "date-time", example: "2026-10-20T00:00:00.000Z" },
          posterUrl: { type: "string", format: "uri", example: "https://example.com/inception.jpg" },
          status: { $ref: "#/components/schemas/MovieStatus" },
        },
      },
      UpdateMovieInput: {
        type: "object",
        properties: {
          title: { type: "string", example: "Inception (Remastered)" },
          description: { type: "string", example: "Bản cập nhật chất lượng cao 4K." },
          durationMinutes: { type: "integer", minimum: 1, example: 150 },
          genre: { type: "string", example: "Sci-Fi / Action" },
          releaseDate: { type: "string", format: "date-time", example: "2026-11-01T00:00:00.000Z" },
          posterUrl: { type: "string", format: "uri", example: "https://example.com/inception-new.jpg" },
          status: { $ref: "#/components/schemas/MovieStatus" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["fullName", "email", "password", "phone"],
        properties: {
          fullName: { type: "string", example: "Nguyen Van A" },
          email: { type: "string", format: "email", example: "nguyenvana@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
          phone: { type: "string", example: "0987654321" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "nguyenvana@example.com" },
          password: { type: "string", format: "password", example: "Password123!" },
        },
      },
      SafeUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "e674092b-8a21-4d10-8533-3d07aa1b88e1" },
          fullName: { type: "string", example: "Nguyen Van A" },
          email: { type: "string", format: "email", example: "nguyenvana@example.com" },
          phone: { type: "string", example: "0987654321" },
          role: { $ref: "#/components/schemas/UserRole" },
          status: { $ref: "#/components/schemas/UserStatus" },
          createdAt: { type: "string", format: "date-time", example: "2026-09-20T03:10:25.867Z" },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Thao tác thành công" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Dữ liệu không hợp lệ" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["durationMinutes must be a positive number"],
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Kiểm tra tình trạng hoạt động của API server",
        responses: {
          200: {
            description: "Server đang hoạt động bình thường",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Cinema Booking System API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản người dùng mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Đăng ký thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SafeUser" },
                  },
                },
              },
            },
          },
          400: {
            description: "Dữ liệu gửi lên không hợp lệ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Email hoặc số điện thoại đã được sử dụng",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập và nhận JWT Access Token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Đăng nhập thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/SafeUser" },
                        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Email hoặc mật khẩu không hợp lệ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Sai thông tin đăng nhập",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lấy thông tin tài khoản hiện tại (yêu cầu đăng nhập)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Lấy thông tin thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SafeUser" },
                  },
                },
              },
            },
          },
          401: {
            description: "Thiếu hoặc Token không hợp lệ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/movies": {
      get: {
        tags: ["Movies"],
        summary: "Lấy danh sách tất cả các bộ phim",
        responses: {
          200: {
            description: "Danh sách phim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get all movies" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Movie" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Movies"],
        summary: "Tạo một bộ phim mới",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMovieInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Tạo phim thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie created" },
                    movie: { $ref: "#/components/schemas/Movie" },
                  },
                },
              },
            },
          },
          400: {
            description: "Dữ liệu tạo phim không hợp lệ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/movies/{id}": {
      get: {
        tags: ["Movies"],
        summary: "Lấy thông tin chi tiết một bộ phim theo ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "UUID của bộ phim",
            schema: { type: "string", format: "uuid" },
            example: "64162d7a-3491-4e80-945f-771476fbc7e3",
          },
        ],
        responses: {
          200: {
            description: "Thông tin bộ phim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get movie 64162d7a-3491-4e80-945f-771476fbc7e3" },
                    data: { $ref: "#/components/schemas/Movie" },
                  },
                },
              },
            },
          },
          404: {
            description: "Không tìm thấy bộ phim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie not found" },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Movies"],
        summary: "Cập nhật thông tin một bộ phim",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "UUID của bộ phim cần cập nhật",
            schema: { type: "string", format: "uuid" },
            example: "64162d7a-3491-4e80-945f-771476fbc7e3",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMovieInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Cập nhật thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie updated" },
                    movie: { $ref: "#/components/schemas/Movie" },
                  },
                },
              },
            },
          },
          400: {
            description: "Dữ liệu cập nhật không hợp lệ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Không tìm thấy bộ phim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie not found" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Movies"],
        summary: "Xóa một bộ phim theo ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "UUID của bộ phim cần xóa",
            schema: { type: "string", format: "uuid" },
            example: "64162d7a-3491-4e80-945f-771476fbc7e3",
          },
        ],
        responses: {
          200: {
            description: "Xóa bộ phim thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie deleted successfully" },
                    movie: { $ref: "#/components/schemas/Movie" },
                  },
                },
              },
            },
          },
          404: {
            description: "Không tìm thấy bộ phim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Movie not found" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Cinema Booking API Docs",
    })
  );

  // Endpoint trả về spec dạng JSON
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
