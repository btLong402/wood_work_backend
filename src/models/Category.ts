import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Product from './Product';

// Category attributes interface
interface CategoryAttributes {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Category creation attributes - all the fields that can be null/generated
interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'description' | 'active' | 'createdAt' | 'updatedAt'> {}

// Category model 
class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public active!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Tên danh mục không được để trống'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  sequelize
});

// Define associations
Category.hasMany(Product, {
  sourceKey: 'id',
  foreignKey: 'categoryId',
  as: 'products'
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

export default Category;