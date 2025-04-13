import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// WoodSpecies attributes interface
interface WoodSpeciesAttributes {
  id: string;
  scientificName: string;
  commonName?: string;
  conservationStatus?: 'Common' | 'Endangered' | 'Rare' | 'CITES I/II';
  createdAt?: Date;
}

// Interface for WoodSpecies creation attributes
interface WoodSpeciesCreationAttributes extends Optional<WoodSpeciesAttributes, 'id' | 'conservationStatus' | 'createdAt'> {}

// WoodSpecies model
class WoodSpecies extends Model<WoodSpeciesAttributes, WoodSpeciesCreationAttributes> implements WoodSpeciesAttributes {
  public id!: string;
  public scientificName!: string;
  public commonName?: string;
  public conservationStatus!: 'Common' | 'Endangered' | 'Rare' | 'CITES I/II';
  
  // Timestamps
  public readonly createdAt!: Date;
}

WoodSpecies.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  scientificName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Tên khoa học không được để trống'
      }
    }
  },
  commonName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  conservationStatus: {
    type: DataTypes.ENUM('Common', 'Endangered', 'Rare', 'CITES I/II'),
    defaultValue: 'Common'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'wood_species',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      unique: true,
      fields: ['scientificName']
    }
  ]
});

export default WoodSpecies;