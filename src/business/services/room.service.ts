import type {
  RoomRepository,
  CreateRoomData,
  UpdateRoomData,
} from "../interfaces/room.interface.js";

import type {
  CinemaRepository,
} from "../interfaces/cinema.interface.js";

export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly cinemaRepository: CinemaRepository,
  ) {}

  async getAllRooms() {
    return this.roomRepository.findAll();
  }

  async getRoomById(id: string) {
    return this.roomRepository.findById(id);
  }

  async createRoom(data: CreateRoomData) {
    const cinema =
      await this.cinemaRepository.findById(data.cinemaId);

    if (!cinema) {
      throw new Error(
        "Rạp chiếu phim không tồn tại trong hệ thống",
      );
    }

    const trimmedName = data.name.trim();

    const existingRoom =
      await this.roomRepository.findByCinemaIdAndName(
        data.cinemaId,
        trimmedName,
      );

    if (existingRoom) {
      throw new Error(
        `Phòng '${trimmedName}' đã tồn tại trong rạp chiếu phim này`,
      );
    }

    const newRoom: CreateRoomData = {
      ...data,
      name: trimmedName,
    };

    return this.roomRepository.create(newRoom);
  }

  async updateRoom(
    id: string,
    data: UpdateRoomData,
  ) {
    const currentRoom =
      await this.roomRepository.findById(id);

    if (!currentRoom) {
      return null;
    }

    const targetCinemaId =
      data.cinemaId !== undefined
        ? data.cinemaId
        : currentRoom.cinemaId;

    const targetName =
      data.name !== undefined
        ? data.name.trim()
        : currentRoom.name;

    // UC-12: validate the Room–Cinema relationship before saving.
    const cinema =
      await this.cinemaRepository.findById(targetCinemaId);

    if (!cinema) {
      throw new Error(
        "Rạp chiếu phim không tồn tại trong hệ thống",
      );
    }

    if (
      targetCinemaId !== currentRoom.cinemaId ||
      targetName !== currentRoom.name
    ) {
      const conflictRoom =
        await this.roomRepository.findByCinemaIdAndName(
          targetCinemaId,
          targetName,
        );

      if (conflictRoom && conflictRoom.id !== id) {
        throw new Error(
          `Phòng '${targetName}' đã tồn tại trong rạp chiếu phim này`,
        );
      }
    }

    const updatedData: UpdateRoomData = {
      ...data,

      ...(data.name !== undefined
        ? { name: targetName }
        : {}),
    };

    return this.roomRepository.update(id, updatedData);
  }

  async deleteRoom(id: string) {
    return this.roomRepository.delete(id);
  }
}