import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Address attributes interface
interface AddressAttributes {
  id: string;
  province?: string;
  district?: string;
  commune?: string;
  details?: string;
  createdAt?: Date;
}

// Interface for Address creation attributes
interface AddressCreationAttributes extends Optional<AddressAttributes, 'id' | 'createdAt'> {}

// Address model
class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  public id!: string;
  public province?: string;
  public district?: string;
  public commune?: string;
  public details?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

Address.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  commune: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'addresses',
  timestamps: true,
  updatedAt: false,
  sequelize
});

export default Address;