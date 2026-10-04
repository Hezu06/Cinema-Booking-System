export const movieSchemas = {
  MovieStatus: {
    type: "string",
    enum: [
      "COMING_SOON",
      "NOW_SHOWING",
      "ENDED",
    ],
    example: "NOW_SHOWING",
  },

  Movie: {
    type: "object",
    required: [
      "id",
      "title",
      "description",
      "durationMinutes",
      "genre",
      "releaseDate",
      "posterUrl",
      "status",
    ],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example:
          "64162d7a-3491-4e80-945f-771476fbc7e3",
      },

      title: {
        type: "string",
        example: "Interstellar",
      },

      description: {
        type: "string",
        example:
          "A team of explorers travel through a wormhole in space.",
      },

      durationMinutes: {
        type: "integer",
        minimum: 1,
        example: 169,
      },

      genre: {
        type: "string",
        example: "Sci-Fi",
      },

      releaseDate: {
        type: "string",
        format: "date-time",
        example:
          "2026-10-20T00:00:00.000Z",
      },

      posterUrl: {
        type: "string",
        format: "uri",
        example:
          "https://example.com/interstellar.jpg",
      },

      status: {
        $ref:
          "#/components/schemas/MovieStatus",
      },
    },
  },

  CreateMovieInput: {
    type: "object",
    required: [
      "title",
      "description",
      "durationMinutes",
      "genre",
      "releaseDate",
      "posterUrl",
      "status",
    ],
    properties: {
      title: {
        type: "string",
        example: "Inception",
      },

      description: {
        type: "string",
        example:
          "A thief who steals corporate secrets through dream-sharing technology.",
      },

      durationMinutes: {
        type: "integer",
        minimum: 1,
        example: 148,
      },

      genre: {
        type: "string",
        example: "Sci-Fi",
      },

      releaseDate: {
        type: "string",
        format: "date-time",
        example:
          "2026-10-20T00:00:00.000Z",
      },

      posterUrl: {
        type: "string",
        format: "uri",
        example:
          "https://example.com/inception.jpg",
      },

      status: {
        $ref:
          "#/components/schemas/MovieStatus",
      },
    },
  },

  UpdateMovieInput: {
    type: "object",
    properties: {
      title: {
        type: "string",
        example: "Inception Remastered",
      },

      description: {
        type: "string",
        example:
          "Updated movie description.",
      },

      durationMinutes: {
        type: "integer",
        minimum: 1,
        example: 150,
      },

      genre: {
        type: "string",
        example: "Sci-Fi / Action",
      },

      releaseDate: {
        type: "string",
        format: "date-time",
        example:
          "2026-11-01T00:00:00.000Z",
      },

      posterUrl: {
        type: "string",
        format: "uri",
        example:
          "https://example.com/inception-new.jpg",
      },

      status: {
        $ref:
          "#/components/schemas/MovieStatus",
      },
    },
  },

  MovieResponse: {
    type: "object",
    required: [
      "success",
      "message",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      message: {
        type: "string",
        example: "Movie created",
      },

      data: {
        $ref:
          "#/components/schemas/Movie",
      },
    },
  },

  MovieListResponse: {
    type: "object",
    required: [
      "success",
      "message",
      "data",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
      },

      message: {
        type: "string",
        example: "Get all movies",
      },

      data: {
        type: "array",
        items: {
          $ref:
            "#/components/schemas/Movie",
        },
      },
    },
  },
};