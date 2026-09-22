export const moviePaths = {
  "/api/movies": {
    get: {
      tags: ["Movies"],

      summary:
        "Lấy danh sách tất cả phim",

      responses: {
        200: {
          description:
            "Danh sách phim",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MovieListResponse",
              },
            },
          },
        },

        500: {
          description:
            "Lỗi khi truy xuất danh sách phim",

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
      tags: ["Movies"],

      summary:
        "Tạo phim mới",

      description:
        "Chỉ Admin được phép tạo Movie.",

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
                "#/components/schemas/CreateMovieInput",
            },
          },
        },
      },

      responses: {
        201: {
          description:
            "Tạo phim thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MovieResponse",
              },
            },
          },
        },

        400: {
          description:
            "Dữ liệu Movie không hợp lệ",

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
            "Người dùng không có quyền Admin",

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
            "Movie với title và releaseDate đã tồn tại",

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
            "Lỗi hệ thống khi tạo Movie",

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

  "/api/movies/{id}": {
    get: {
      tags: ["Movies"],

      summary:
        "Lấy thông tin chi tiết Movie theo ID",

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          description:
            "UUID của Movie",

          schema: {
            type: "string",
            format: "uuid",
          },

          example:
            "64162d7a-3491-4e80-945f-771476fbc7e3",
        },
      ],

      responses: {
        200: {
          description:
            "Lấy Movie thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MovieResponse",
              },
            },
          },
        },

        400: {
          description:
            "Movie ID không hợp lệ",

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
            "Movie không tồn tại",

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
            "Lỗi khi truy xuất Movie",

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
      tags: ["Movies"],

      summary:
        "Cập nhật Movie",

      description:
        "Chỉ Admin được phép cập nhật Movie.",

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
            "UUID của Movie",

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
                "#/components/schemas/UpdateMovieInput",
            },
          },
        },
      },

      responses: {
        200: {
          description:
            "Cập nhật Movie thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MovieResponse",
              },
            },
          },
        },

        400: {
          description:
            "ID hoặc dữ liệu Movie không hợp lệ",

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

        404: {
          description:
            "Movie không tồn tại",

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
            "Movie bị trùng title và releaseDate",

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
            "Lỗi hệ thống khi cập nhật Movie",

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
      tags: ["Movies"],

      summary:
        "Xóa Movie",

      description:
        "Chỉ Admin được phép xóa Movie.",

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
            "UUID của Movie",

          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],

      responses: {
        200: {
          description:
            "Xóa Movie thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/MovieResponse",
              },
            },
          },
        },

        400: {
          description:
            "Movie ID không hợp lệ",

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

        404: {
          description:
            "Movie không tồn tại",

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
            "Lỗi hệ thống khi xóa Movie",

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