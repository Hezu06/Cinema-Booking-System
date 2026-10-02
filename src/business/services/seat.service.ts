import type { RoomRepository } from "../interfaces/room.interface.js";
import type {
  CreateSeatData,
  SeatFilters,
  SeatRepository,
  UpdateSeatData,
} from "../interfaces/seat.interface.js";

export class SeatService {
  constructor(
    private readonly seatRepository: SeatRepository,
    private readonly roomRepository: RoomRepository,
  ) {}

  getAllSeats(filters?: SeatFilters) {
    return this.seatRepository.findAll(filters);
  }

  getSeatById(id: string) {
    return this.seatRepository.findById(id);
  }

  async createSeat(data: CreateSeatData) {
    const room = await this.roomRepository.findById(data.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    const seatCount = await this.seatRepository.countByRoomId(data.roomId);
    if (seatCount >= room.capacity) throw new Error("ROOM_CAPACITY_EXCEEDED");

    const rowLabel = data.rowLabel.trim().toUpperCase();
    const duplicate = await this.seatRepository.findByPosition(data.roomId, rowLabel, data.seatNumber);
    if (duplicate) throw new Error("SEAT_POSITION_EXISTS");

    return this.seatRepository.create({ ...data, rowLabel });
  }

  async updateSeat(id: string, data: UpdateSeatData) {
    const currentSeat = await this.seatRepository.findById(id);
    if (!currentSeat) return null;

    const roomId = data.roomId ?? currentSeat.roomId;
    const rowLabel = (data.rowLabel ?? currentSeat.rowLabel).trim().toUpperCase();
    const seatNumber = data.seatNumber ?? currentSeat.seatNumber;
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    if (roomId !== currentSeat.roomId) {
      const seatCount = await this.seatRepository.countByRoomId(roomId);
      if (seatCount >= room.capacity) throw new Error("ROOM_CAPACITY_EXCEEDED");
    }

    const duplicate = await this.seatRepository.findByPosition(roomId, rowLabel, seatNumber);
    if (duplicate && duplicate.id !== id) throw new Error("SEAT_POSITION_EXISTS");

    return this.seatRepository.update(id, {
      ...data,
      ...(data.rowLabel !== undefined ? { rowLabel } : {}),
    });
  }

  deleteSeat(id: string) {
    return this.seatRepository.delete(id);
  }
}
