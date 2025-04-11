import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Product attributes interface
interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  productType: 'furniture' | 'decoration' | 'outdoor' | 'accessories'; // Renamed from 'category' to 'productType'
  categoryId: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Product creation attributes - all the fields that can be null/generated
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'stock' | 'imageUrl' | 'active' | 'createdAt' | 'updatedAt'> {}

// Product model 
class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stock!: number;
  public productType!: 'furniture' | 'decoration' | 'outdoor' | 'accessories'; // Renamed from 'category' to 'productType'
  public categoryId!: number;
  public imageUrl?: string;
  public active!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tên sản phẩm không được để trống'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Mô tả sản phẩm không được để trống'
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'Số lượng tồn kho phải là số nguyên'
      },
      min: {
        args: [0],
        msg: 'Số lượng tồn kho không được âm'
      }
    }
  },
  productType: { // Renamed from 'category' to 'productType'
    type: DataTypes.ENUM('furniture', 'decoration', 'outdoor', 'accessories'),
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  sequelize
});

export default Product;