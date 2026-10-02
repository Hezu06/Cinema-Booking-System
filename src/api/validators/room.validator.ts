import { z } from "zod";

import {
  RoomType,
} from "../../business/models/room.model.js";

export const roomTypeSchema = z.enum([
  RoomType.STANDARD,
  RoomType.VIP,
  RoomType.IMAX,
  RoomType.THREE_D,
]);

export const createRoomSchema = z.object({
  cinemaId: z
    .string({
      message: "cinemaId is required",
    })
    .uuid("ID rạp (cinemaId) phải có định dạng UUID hợp lệ"),

  name: z
    .string({
      message: "name is required",
    })
    .trim()
    .min(1, "name is required and must not be empty"),

  type: roomTypeSchema,

  capacity: z
    .number({
      message: "capacity is required and must be a positive integer",
    })
    .int("capacity must be an integer")
    .positive("capacity must be a positive integer"),
});

export type CreateRoomInput =
  z.infer<typeof createRoomSchema>;

export const updateRoomSchema =
  createRoomSchema.partial();

export type UpdateRoomInput =
  z.infer<typeof updateRoomSchema>;

export const roomIdParamSchema = z.object({
  id: z
    .string()
    .uuid("ID phòng (id) phải có định dạng UUID hợp lệ"),
});

export type RoomIdParam =
  z.infer<typeof roomIdParamSchema>;