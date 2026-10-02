export const RoomType = {
  STANDARD: "STANDARD",
  VIP: "VIP",
  IMAX: "IMAX",
  THREE_D: "THREE_D"
} as const

export type RoomType = typeof RoomType[keyof typeof RoomType]

export interface Room {
  id: string,
  cinemaId: string,
  name: string,
  type: RoomType,
  capacity: number,
  createdAt: Date,
  updatedAt: Date
}

