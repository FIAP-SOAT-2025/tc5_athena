import { api } from './client';
import { CreateUserDto, User } from '../types';

export const usersApi = {
  create: async (userData: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  getByIdentifier: async (identifier: string): Promise<User> => {
    const response = await api.get<User>(`/users/${identifier}`);
    return response.data;
  },
};
