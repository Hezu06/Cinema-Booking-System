import type { Seat, SeatType } from "../models/seat.model.js";

export interface SeatFilters {
  roomId?: string | undefined;
  active?: boolean | undefined;
}

export interface CreateSeatData {
  roomId: string;
  rowLabel: string;
  seatNumber: number;
  type: SeatType;
  active?: boolean | undefined;
}

export interface UpdateSeatData {
  roomId?: string | undefined;
  rowLabel?: string | undefined;
  seatNumber?: number | undefined;
  type?: SeatType | undefined;
  active?: boolean | undefined;
}

export interface SeatRepository {
  findAll(filters?: SeatFilters): Promise<Seat[]>;
  findById(id: string): Promise<Seat | null>;
  findByPosition(roomId: string, rowLabel: string, seatNumber: number): Promise<Seat | null>;
  countByRoomId(roomId: string): Promise<number>;
  create(data: CreateSeatData): Promise<Seat>;
  update(id: string, data: UpdateSeatData): Promise<Seat | null>;
  delete(id: string): Promise<Seat | null>;
}
