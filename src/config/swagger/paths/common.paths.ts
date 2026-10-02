export const commonPaths = {
  "/health": {
    get: {
      tags: ["Health"],

      summary:
        "Kiểm tra tình trạng hoạt động của API server",

      responses: {
        200: {
          description:
            "Server đang hoạt động bình thường",

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/HealthResponse",
              },
            },
          },
        },
      },
    },
  },
};