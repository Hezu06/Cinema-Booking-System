export const authSchemas = {
  UserRole: {
    type: "string",
    enum: [
      "CUSTOMER",
      "ADMIN",
    ],
    example: "CUSTOMER",
  },

  UserStatus: {
    type: "string",
    enum: [
      "ACTIVE",
      "BLOCKED",
    ],
    example: "ACTIVE",
  },

  RegisterInput: {
    type: "object",
    required: [
      "fullName",
      "email",
      "password",
      "phone",
    ],
    properties: {
      fullName: {
        type: "string",
        minLength: 2,
        example: "Nguyen Van A",
      },

      email: {
        type: "string",
        format: "email",
        example: "nguyenvana@example.com",
      },

      password: {
        type: "string",
        format: "password",
        minLength: 8,
        example: "Password123!",
      },

      phone: {
        type: "string",
        pattern: "^[0-9]{9,11}$",
        example: "0987654321",
      },
    },
  },

  LoginInput: {
    type: "object",
    required: [
      "email",
      "password",
    ],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "nguyenvana@example.com",
      },

      password: {
        type: "string",
        format: "password",
        example: "Password123!",
      },
    },
  },

  SafeUser: {
    type: "object",
    required: [
      "id",
      "fullName",
      "email",
      "phone",
      "role",
      "status",
      "createdAt",
    ],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example:
          "e674092b-8a21-4d10-8533-3d07aa1b88e1",
      },

      fullName: {
        type: "string",
        example: "Nguyen Van A",
      },

      email: {
        type: "string",
        format: "email",
        example: "nguyenvana@example.com",
      },

      phone: {
        type: "string",
        example: "0987654321",
      },

      role: {
        $ref:
          "#/components/schemas/UserRole",
      },

      status: {
        $ref:
          "#/components/schemas/UserStatus",
      },

      createdAt: {
        type: "string",
        format: "date-time",
        example:
          "2026-09-20T03:10:25.867Z",
      },
    },
  },

  AuthResult: {
    type: "object",
    required: [
      "user",
      "accessToken",
    ],
    properties: {
      user: {
        $ref:
          "#/components/schemas/SafeUser",
      },

      accessToken: {
        type: "string",
        example:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },

  RegisterResponse: {
    type: "object",
    required: [
      "success",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      data: {
        $ref:
          "#/components/schemas/SafeUser",
      },
    },
  },

  LoginResponse: {
    type: "object",
    required: [
      "success",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      data: {
        $ref:
          "#/components/schemas/AuthResult",
      },
    },
  },

  MeResponse: {
    type: "object",
    required: [
      "success",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      data: {
        $ref:
          "#/components/schemas/SafeUser",
      },
    },
  },
};