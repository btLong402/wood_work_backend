import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Permission attributes interface
interface PermissionAttributes {
  id: string;
  name: string;
  createdAt?: Date;
}

// Interface for Permission creation attributes
interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'createdAt'> {}

// Permission model
class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: string;
  public name!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Permission.init({
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
        msg: 'Tên quyền hạn không được để trống'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  updatedAt: false,
  sequelize
});

export default Permission;