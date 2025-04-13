import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import Transaction from './Transaction';
import File from './File';

// TransactionDocument attributes interface
interface TransactionDocumentAttributes {
  id: string;
  transactionId: string;
  documentType: 'Receipt' | 'Contract' | 'Other';
  fileId: string;
  createdAt?: Date;
}

// Interface for TransactionDocument creation attributes
interface TransactionDocumentCreationAttributes extends Optional<TransactionDocumentAttributes, 'id' | 'createdAt'> {}

// TransactionDocument model
class TransactionDocument extends Model<TransactionDocumentAttributes, TransactionDocumentCreationAttributes> implements TransactionDocumentAttributes {
  public id!: string;
  public transactionId!: string;
  public documentType!: 'Receipt' | 'Contract' | 'Other';
  public fileId!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

TransactionDocument.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  transactionId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: Transaction,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  documentType: {
    type: DataTypes.ENUM('Receipt', 'Contract', 'Other'),
    allowNull: false
  },
  fileId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: File,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transaction_documents',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['transactionId']
    },
    {
      fields: ['fileId']
    }
  ]
});

// Set up relationships
TransactionDocument.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
TransactionDocument.belongsTo(File, { foreignKey: 'fileId', as: 'file' });

Transaction.hasMany(TransactionDocument, { foreignKey: 'transactionId', as: 'documents' });
File.hasOne(TransactionDocument, { foreignKey: 'fileId', as: 'transactionDocument' });

export default TransactionDocument;