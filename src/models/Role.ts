import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Role attributes interface
interface RoleAttributes {
  id: string;
  name: string;
  createdAt?: Date;
}

// Interface for Role creation attributes
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'createdAt'> {}

// Role model
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Role.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  name: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Tên vai trò không được để trống'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'roles',
  timestamps: true,
  updatedAt: false,
  sequelize
});

export default Role;