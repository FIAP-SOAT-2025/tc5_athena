import { User } from '../../domain/user.entity';

export interface UserRepositoryInterface {
  create(user: User): Promise<User>;
  findByUserEmail(email: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailOrId(identifier: string): Promise<User | null>;
}
