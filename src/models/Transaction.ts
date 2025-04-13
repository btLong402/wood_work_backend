import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import WoodLot from './WoodLot';
import User from './User';

// Transaction attributes interface
interface TransactionAttributes {
  id: string;
  woodLotId?: string;
  buyerId?: string;
  sellerId?: string;
  price?: number;
  transactionDate?: Date;
  status?: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  createdAt?: Date;
  createdById?: string;
}

// Interface for Transaction creation attributes
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'price' | 'transactionDate' | 'status' | 'createdAt'> {}

// Transaction model
class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public woodLotId?: string;
  public buyerId?: string;
  public sellerId?: string;
  public price?: number;
  public transactionDate?: Date;
  public status!: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  public createdById?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Transaction.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  woodLotId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: WoodLot,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  buyerId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  sellerId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: 'Giá phải là số'
      },
      min: {
        args: [0],
        msg: 'Giá không được âm'
      }
    }
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdById: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['woodLotId']
    },
    {
      fields: ['buyerId']
    },
    {
      fields: ['sellerId']
    },
    {
      fields: ['createdById']
    },
    {
      fields: ['status']
    },
    {
      fields: ['transactionDate']
    }
  ]
});

// Set up relationships
Transaction.belongsTo(WoodLot, { foreignKey: 'woodLotId', as: 'woodLot' });
Transaction.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Transaction.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Transaction.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

WoodLot.hasMany(Transaction, { foreignKey: 'woodLotId', as: 'transactions' });
User.hasMany(Transaction, { foreignKey: 'buyerId', as: 'purchases' });
User.hasMany(Transaction, { foreignKey: 'sellerId', as: 'sales' });
User.hasMany(Transaction, { foreignKey: 'createdById', as: 'createdTransactions' });

export default Transaction;