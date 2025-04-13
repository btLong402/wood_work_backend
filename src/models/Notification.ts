import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// Notification attributes interface
interface NotificationAttributes {
  id: string;
  content: string;
  senderId?: string;
  receiverId?: string;
  entityId?: string;
  entityType: 'transaction' | 'wood_lot' | 'user';
  isRead?: boolean;
  createdAt?: Date;
}

// Interface for Notification creation attributes
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'createdAt'> {}

// Notification model
class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public content!: string;
  public senderId?: string;
  public receiverId?: string;
  public entityId?: string;
  public entityType!: 'transaction' | 'wood_lot' | 'user';
  public isRead!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Notification.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nội dung thông báo không được để trống'
      }
    }
  },
  senderId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  receiverId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  entityId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  entityType: {
    type: DataTypes.ENUM('transaction', 'wood_lot', 'user'),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['receiverId']
    },
    {
      fields: ['senderId']
    },
    {
      fields: ['entityId', 'entityType']
    },
    {
      fields: ['isRead']
    }
  ]
});

// Set up relationships
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Notification.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
User.hasMany(Notification, { foreignKey: 'receiverId', as: 'receivedNotifications' });

export default Notification;