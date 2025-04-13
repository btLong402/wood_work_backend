import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import WoodSpecies from './WoodSpecies';
import User from './User';

// WoodLot attributes interface
interface WoodLotAttributes {
  id: string;
  speciesId?: string;
  origin?: string;
  quantity: number;
  unit?: string;
  quality?: 'High' | 'Medium' | 'Low';
  harvestDate?: Date;
  createdAt?: Date;
  createdById?: string;
}

// Interface for WoodLot creation attributes
interface WoodLotCreationAttributes extends Optional<WoodLotAttributes, 'id' | 'unit' | 'quality' | 'harvestDate' | 'createdAt'> {}

// WoodLot model
class WoodLot extends Model<WoodLotAttributes, WoodLotCreationAttributes> implements WoodLotAttributes {
  public id!: string;
  public speciesId?: string;
  public origin?: string;
  public quantity!: number;
  public unit!: string;
  public quality?: 'High' | 'Medium' | 'Low';
  public harvestDate?: Date;
  public createdById?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

WoodLot.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  speciesId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    references: {
      model: WoodSpecies,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  origin: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: {
        msg: 'Số lượng phải là số'
      },
      min: {
        args: [0],
        msg: 'Số lượng không được âm'
      }
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'm³'
  },
  quality: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    allowNull: true
  },
  harvestDate: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'wood_lots',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['speciesId']
    },
    {
      fields: ['createdById']
    },
    {
      fields: ['harvestDate']
    }
  ]
});

// Set up relationships
WoodLot.belongsTo(WoodSpecies, { foreignKey: 'speciesId', as: 'species' });
WoodLot.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

WoodSpecies.hasMany(WoodLot, { foreignKey: 'speciesId', as: 'woodLots' });
User.hasMany(WoodLot, { foreignKey: 'createdById', as: 'createdWoodLots' });

export default WoodLot;