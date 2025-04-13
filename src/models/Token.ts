import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// Token attributes interface
interface TokenAttributes {
  id: string;
  token: string;
  userId?: string;
  expiresAt?: Date;
  createdAt?: Date;
}

// Interface for Token creation attributes
interface TokenCreationAttributes extends Optional<TokenAttributes, 'id' | 'createdAt'> {}

// Token model
class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {
  public id!: string;
  public token!: string;
  public userId?: string;
  public expiresAt?: Date;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Token.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Token không được để trống'
      }
    }
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tokens',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Set up relationships
Token.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });

export default Token;