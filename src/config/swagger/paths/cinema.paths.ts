export const cinemaPaths = {
  "/api/cinemas": {
    get: {
      tags: ["Cinemas"],

      summary:
        "Lấy danh sách tất cả Cinema",

      description:
        "Endpoint quản trị. Yêu cầu quyền Admin.",

      security: [
        {
          BearerAuth: [],
        },
      ],

      responses: {
        200: {
          description:
            "Lấy danh sách Cinema thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/CinemaListResponse",
              },
            },
          },
        },

        401: {
          description:
            "Chưa đăng nhập hoặc JWT không hợp lệ",

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
            "Không có quyền Admin",

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
            "Lỗi khi truy xuất Cinema",

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

    post: {
      tags: ["Cinemas"],

      summary:
        "Tạo Cinema mới",

      description:
        "Endpoint quản trị. Yêu cầu quyền Admin.",

      security: [
        {
          BearerAuth: [],
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/CreateCinemaInput",
            },
          },
        },
      },

      responses: {
        201: {
          description:
            "Tạo Cinema thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/CinemaResponse",
              },
            },
          },
        },

        400: {
          description:
            "Dữ liệu Cinema không hợp lệ",

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
            "Chưa đăng nhập hoặc JWT không hợp lệ",

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
            "Không có quyền Admin",

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
            "Lỗi hệ thống khi tạo Cinema",

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

  "/api/cinemas/{id}": {
    get: {
      tags: ["Cinemas"],

      summary:
        "Lấy Cinema theo ID",

      security: [
        {
          BearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          description:
            "UUID của Cinema",

          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      responses: {
        200: {
          description:
            "Lấy Cinema thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/CinemaResponse",
              },
            },
          },
        },

        400: {
          description:
            "Cinema ID không hợp lệ",

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
            "Chưa đăng nhập",

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
            "Không có quyền Admin",

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
            "Cinema không tồn tại",

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
            "Lỗi hệ thống",

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

    put: {
      tags: ["Cinemas"],

      summary:
        "Cập nhật Cinema",

      security: [
        {
          BearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/UpdateCinemaInput",
            },
          },
        },
      },

      responses: {
        200: {
          description:
            "Cập nhật Cinema thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/CinemaResponse",
              },
            },
          },
        },

        400: {
          description:
            "ID hoặc dữ liệu Cinema không hợp lệ",

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
            "Chưa đăng nhập",

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
            "Không có quyền Admin",

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
            "Cinema không tồn tại",

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
            "Lỗi hệ thống",

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

    delete: {
      tags: ["Cinemas"],

      summary:
        "Xóa Cinema",

      description:
        "Không thể xóa Cinema nếu việc xóa vi phạm quan hệ dữ liệu, ví dụ Cinema vẫn còn Room.",

      security: [
        {
          BearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      responses: {
        200: {
          description:
            "Xóa Cinema thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/CinemaResponse",
              },
            },
          },
        },

        400: {
          description:
            "Cinema ID không hợp lệ",

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
            "Chưa đăng nhập",

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
            "Không có quyền Admin",

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
            "Cinema không tồn tại",

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
            "Cinema đang có dữ liệu liên quan và không thể xóa",

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
            "Lỗi hệ thống",

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
};