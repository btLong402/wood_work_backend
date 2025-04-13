import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// ActivityLog attributes interface
interface ActivityLogAttributes {
  id: string;
  userId?: string;
  action: 'add' | 'edit' | 'delete' | 'approve' | 'submit' | 'view';
  entityType: string;
  entityId?: string;
  message?: string;
  timestamp?: Date;
  ipAddress?: string;
}

// Interface for ActivityLog creation attributes
interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'message' | 'timestamp' | 'ipAddress'> {}

// ActivityLog model
class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: string;
  public userId?: string;
  public action!: 'add' | 'edit' | 'delete' | 'approve' | 'submit' | 'view';
  public entityType!: string;
  public entityId?: string;
  public message?: string;
  public timestamp!: Date;
  public ipAddress?: string;
}

ActivityLog.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  action: {
    type: DataTypes.ENUM('add', 'edit', 'delete', 'approve', 'submit', 'view'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  timestamps: false,
  sequelize,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['timestamp']
    }
  ]
});

// Set up relationships
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });

export default ActivityLog;