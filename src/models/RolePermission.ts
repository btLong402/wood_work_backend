import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import Role from './Role';
import Permission from './Permission';

// Role-Permission attributes interface
interface RolePermissionAttributes {
  roleId: string;
  permissionId: string;
}

// RolePermission model
class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public roleId!: string;
  public permissionId!: string;
}

RolePermission.init({
  roleId: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    references: {
      model: Role,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  permissionId: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    references: {
      model: Permission,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'role_permissions',
  timestamps: false,
  sequelize
});

// Set up the many-to-many relationship
Role.belongsToMany(Permission, { 
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, { 
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

export default RolePermission;