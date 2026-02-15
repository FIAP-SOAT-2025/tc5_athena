import { User } from '../domain/user.entity';

export interface userRepositoryInterface {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailOrId(identifier: string): Promise<User | null>;
}
