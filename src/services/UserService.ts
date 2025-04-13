import { Op } from 'sequelize';
import { BaseService } from './BaseService';
import User from '../models/User';
import { AppError } from '../utils/appError';
import bcrypt from 'bcrypt';
import Role from '../models/Role';
import Address from '../models/Address';

export class UserService extends BaseService<User> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ where: { username } });
  }

  /**
   * Create a new user with complete profile information
   */
  async createUser(userData: {
    username?: string;
    password: string;
    fullName?: string;
    email?: string;
    phone?: string;
    addressId?: string;
    roleId?: string;
  }): Promise<User> {
    // Check if email already exists
    if (userData.email) {
      const existingByEmail = await this.findByEmail(userData.email);
      if (existingByEmail) {
        throw new AppError('Email đã được sử dụng', 400);
      }
    }

    // Check if username already exists
    if (userData.username) {
      const existingByUsername = await this.findByUsername(userData.username);
      if (existingByUsername) {
        throw new AppError('Tên đăng nhập đã được sử dụng', 400);
      }
    }

    // Create the user
    return this.create(userData);
  }

  /**
   * Get user with role and address information
   */
  async getUserWithDetails(userId: string): Promise<User | null> {
    return this.findById(userId, {
      include: [
        { model: Role, as: 'role' },
        { model: Address, as: 'address' }
      ],
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Check if current password matches
    if (!(await user.isPasswordMatch(currentPassword))) {
      throw new AppError('Mật khẩu hiện tại không chính xác', 401);
    }

    // Update password
    return this.update(userId, { password: newPassword });
  }

  /**
   * Find users by role
   */
  async findByRole(roleId: string): Promise<User[]> {
    return this.findAll({
      where: { roleId },
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Search users by name, email, or username
   */
  async searchUsers(query: string): Promise<User[]> {
    return this.findAll({
      where: {
        [Op.or]: [
          { fullName: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { username: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: { exclude: ['password'] }
    });
  }
}