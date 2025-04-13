import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// File attributes interface
interface FileAttributes {
  id: string;
  filename: string;
  filepath: string;
  filetype?: string;
  filesize?: number;
  entityId: string;
  entityType: string;
  createdAt?: Date;
  createdById?: string;
}

// Interface for File creation attributes
interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'filetype' | 'filesize' | 'createdAt'> {}

// File model
class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: string;
  public filename!: string;
  public filepath!: string;
  public filetype?: string;
  public filesize?: number;
  public entityId!: string;
  public entityType!: string;
  public createdById?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
}

File.init({
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tên tệp tin không được để trống'
      }
    }
  },
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Đường dẫn tệp tin không được để trống'
      }
    }
  },
  filetype: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  filesize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: {
        msg: 'Kích thước tệp tin phải là số nguyên'
      },
      min: {
        args: [0],
        msg: 'Kích thước tệp tin không được âm'
      }
    }
  },
  entityId: {
    type: DataTypes.CHAR(36),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false
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
  tableName: 'files',
  timestamps: true,
  updatedAt: false,
  sequelize,
  indexes: [
    {
      fields: ['entityId', 'entityType']
    },
    {
      fields: ['createdById']
    }
  ]
});

// Set up relationships
File.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
User.hasMany(File, { foreignKey: 'createdById', as: 'uploadedFiles' });

export default File;