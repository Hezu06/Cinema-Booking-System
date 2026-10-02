export const SeatType = {
  STANDARD: "STANDARD",
  VIP: "VIP",
  COUPLE: "COUPLE",
} as const;

export type SeatType = typeof SeatType[keyof typeof SeatType];

export interface Seat {
  id: string;
  roomId: string;
  rowLabel: string;
  seatNumber: number;
  type: SeatType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
