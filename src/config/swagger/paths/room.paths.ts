export const roomPaths = {
  "/api/rooms": {
    get: {
      tags: ["Rooms"],

      summary:
        "Lấy danh sách tất cả Room",

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
            "Lấy danh sách Room thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RoomListResponse",
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

    post: {
      tags: ["Rooms"],

      summary:
        "Tạo Room mới",

      description:
        "Room phải tham chiếu tới một Cinema tồn tại và tên Room phải duy nhất trong phạm vi Cinema.",

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
                "#/components/schemas/CreateRoomInput",
            },
          },
        },
      },

      responses: {
        201: {
          description:
            "Tạo Room thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RoomResponse",
              },
            },
          },
        },

        400: {
          description:
            "Dữ liệu Room không hợp lệ",

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
            "Cinema được tham chiếu không tồn tại",

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
            "Tên Room đã tồn tại trong Cinema này",

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

  "/api/rooms/{id}": {
    get: {
      tags: ["Rooms"],

      summary:
        "Lấy Room theo ID",

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
            "Lấy Room thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RoomResponse",
              },
            },
          },
        },

        400: {
          description:
            "Room ID không hợp lệ",

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
            "Room không tồn tại",

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
      tags: ["Rooms"],

      summary:
        "Cập nhật Room",

      description:
        "Có thể thay đổi Cinema, nhưng cinemaId mới phải tham chiếu tới Cinema tồn tại.",

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
                "#/components/schemas/UpdateRoomInput",
            },
          },
        },
      },

      responses: {
        200: {
          description:
            "Cập nhật Room thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RoomResponse",
              },
            },
          },
        },

        400: {
          description:
            "ID hoặc dữ liệu Room không hợp lệ",

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
            "Room hoặc Cinema được tham chiếu không tồn tại",

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
            "Tên Room bị trùng trong Cinema đích",

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
      tags: ["Rooms"],

      summary:
        "Xóa Room",

      description:
        "Chỉ Admin được phép xóa Room. Việc xóa có thể bị từ chối nếu Room đang được dữ liệu khác tham chiếu.",

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
            "Xóa Room thành công",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/RoomResponse",
              },
            },
          },
        },

        400: {
          description:
            "Room ID không hợp lệ",

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
            "Room không tồn tại",

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
            "Room đang được dữ liệu khác tham chiếu",

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