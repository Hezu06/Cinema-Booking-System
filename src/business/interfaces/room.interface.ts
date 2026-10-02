import type {
  Room,
  RoomType,
} from "../models/room.model.js";

export interface RoomRepository {
  findAll(): Promise<Room[]>;

  findById(id: string): Promise<Room | null>;

  findByCinemaIdAndName(
    cinemaId: string,
    name: string,
  ): Promise<Room | null>;

  create(data: CreateRoomData): Promise<Room>;

  update(
    id: string,
    data: UpdateRoomData,
  ): Promise<Room | null>;

  delete(id: string): Promise<Room | null>;
}

export interface CreateRoomData {
  cinemaId: string;
  name: string;
  type: RoomType;
  capacity: number;
}

export interface UpdateRoomData {
  cinemaId?: string | undefined;
  name?: string | undefined;
  type?: RoomType | undefined;
  capacity?: number | undefined;
}