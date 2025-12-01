import apiClient from './client';
import { User, ApiResponse, PaginatedResponse, PaginationParams } from '../types';

export const usersApi = {
  // Get all users
  getAll: async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return response.data;
  },

  // Get single user
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: Partial<User> & { password: string }): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },

  // Toggle user status
  toggleStatus: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/users/statistics');
    return response.data;
  },
};
