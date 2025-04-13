import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import Address from './Address';
import Role from './Role';

// User attributes interface
interface UserAttributes {
  id: string;
  username?: string;
  password: string;
  fullName?: string;
  phone?: string;
  email?: string;
  addressId?: string;
  roleId?: string;
  createdAt?: Date;
  isActive?: boolean;
}

// Interface for User creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'isActive'> {}

// User model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username?: string;
  public password!: string;
  public fullName?: string;
  public phone?: string;
  public email?: string;
  public addressId?: string;
  public roleId?: string;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  
  // Instance method để kiểm tra mật khẩu
  public async isPasswordMatch(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
    validate: {
      len: {
        args: [3, 30],
        msg: 'Tên đăng nhập phải có từ 3-30 ký tự'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'Mật khẩu phải có ít nhất 6 ký tự'
      }
    }
  },
  fullName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9\+\-\s]*$/i,
        msg: 'Số điện thoại không hợp lệ'
      }
    }
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Email không hợp lệ'
      }
    }
  },
  addressId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: Address,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  roleId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: Role,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  updatedAt: false,
  sequelize,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Set up relationships
User.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Address.hasMany(User, { foreignKey: 'addressId', as: 'users' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

export default User;