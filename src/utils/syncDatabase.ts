import { sequelize } from '../config/database';
import User from '../models/User';
import Product from '../models/Product';
import Category from '../models/Category';
// Import các model khác ở đây khi cần

// Extend the global NodeJS namespace to include our custom property
declare global {
  namespace NodeJS {
    interface Global {
      categoryIds: Record<string, number>;
    }
  }
}

const syncDatabase = async (): Promise<void> => {
  try {
    console.log('Starting database sync...');
    
    // Parse command line arguments properly, looking for our specific flags
    // This ensures it works regardless of how the script is run (node, ts-node, etc.)
    const args = process.argv;
    console.log("Available command line arguments:", args);
    
    // Check for --force flag anywhere in the arguments
    const forceSync = args.some(arg => arg === '--force');
    console.log(`Syncing with force=${forceSync}`);
    
    await sequelize.sync({ force: forceSync });
    console.log('Đồng bộ hóa cơ sở dữ liệu thành công.');
    
    // Check for --seed flag anywhere in the arguments
    if (args.some(arg => arg === '--seed')) {
      console.log('Đang tạo dữ liệu mẫu...');
      try {
        await createSampleData();
        console.log('Tạo dữ liệu mẫu thành công.');
      } catch (error) {
        console.error('Lỗi khi tạo dữ liệu mẫu:', error);
      }
    }
    
    console.log('Database operations completed.');
    process.exit(0);
  } catch (error) {
    console.error('Đồng bộ hóa cơ sở dữ liệu thất bại:', error);
    process.exit(1);
  }
};

const createSampleData = async (): Promise<void> => {
  // Tạo dữ liệu mẫu cho từng model - theo thứ tự phù hợp với các quan hệ
  await createUsers();
  await createCategories();
  await createProducts();
  
  // Gọi các hàm tạo dữ liệu mẫu cho model khác ở đây
};

const createUsers = async (): Promise<void> => {
  console.log('Tạo dữ liệu người dùng mẫu...');
  
  type UserDataType = {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
  };

  const users: UserDataType[] = [
    {
      name: 'Admin User',
      email: 'admin@woodwork.com',
      password: 'Admin@123',
      role: 'admin'
    },
    {
      name: 'Regular User',
      email: 'user@woodwork.com',
      password: 'User@123',
      role: 'user'
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      role: 'user'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Password123',
      role: 'user'
    },
    {
      name: 'Manager User',
      email: 'manager@woodwork.com',
      password: 'Manager@123',
      role: 'admin'
    }
  ];

  try {
    for (const userData of users) {
      await User.create(userData);
    }
    console.log(`✅ Đã tạo ${users.length} người dùng mẫu`);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu người dùng:', error);
  }
};

const createCategories = async (): Promise<void> => {
  console.log('Tạo dữ liệu danh mục sản phẩm mẫu...');
  
  const categories = [
    {
      name: 'Nội thất',
      description: 'Các sản phẩm nội thất gỗ cho phòng khách, phòng ngủ, phòng ăn và văn phòng.'
    },
    {
      name: 'Đồ trang trí',
      description: 'Các sản phẩm gỗ dùng để trang trí không gian sống.'
    },
    {
      name: 'Ngoại thất',
      description: 'Các sản phẩm gỗ sử dụng ngoài trời, sân vườn, ban công.'
    },
    {
      name: 'Phụ kiện',
      description: 'Các phụ kiện nhỏ làm từ gỗ như hộp đựng, đế lót, đồ dùng nhà bếp.'
    }
  ];

  try {
    // Tạo các danh mục và lưu trữ id để sử dụng khi tạo sản phẩm
    const categoryMap: Record<string, number> = {};
    for (const categoryData of categories) {
      const category = await Category.create(categoryData);
      categoryMap[categoryData.name] = category.id;
    }
    console.log(`✅ Đã tạo ${categories.length} danh mục sản phẩm mẫu`);
    
    // Lưu id của các danh mục vào global để sử dụng khi tạo sản phẩm
    (global as any).categoryIds = categoryMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu danh mục:', error);
  }
};

const createProducts = async (): Promise<void> => {
  console.log('Tạo dữ liệu sản phẩm mẫu...');
  
  // Sử dụng categoryIds từ global để liên kết sản phẩm với danh mục
  const categoryMap: Record<string, number> = (global as any).categoryIds || {
    'Nội thất': 1,
    'Đồ trang trí': 2,
    'Ngoại thất': 3,
    'Phụ kiện': 4
  };
  
  type ProductType = 'furniture' | 'decoration' | 'outdoor' | 'accessories';
  
  type ProductDataType = {
    name: string;
    description: string;
    price: number;
    stock: number;
    productType: ProductType; // Updated from category to productType
    categoryId: number;
    imageUrl: string;
  };
  
  const products: ProductDataType[] = [
    {
      name: 'Ghế gỗ sồi cao cấp',
      description: 'Ghế gỗ sồi tự nhiên, thiết kế hiện đại, chân ghế chắc chắn, phù hợp với nhiều không gian nội thất.',
      price: 1200000,
      stock: 15,
      productType: 'furniture', // Updated from category to productType
      categoryId: categoryMap['Nội thất'],
      imageUrl: 'https://example.com/images/oak-chair.jpg'
    },
    {
      name: 'Bàn ăn gỗ thông',
      description: 'Bàn ăn gỗ thông tự nhiên, thiết kế đơn giản, chắc chắn, phù hợp cho gia đình 4-6 người.',
      price: 3500000,
      stock: 8,
      productType: 'furniture', // Updated from category to productType
      categoryId: categoryMap['Nội thất'],
      imageUrl: 'https://example.com/images/pine-dining-table.jpg'
    },
    {
      name: 'Kệ sách gỗ walnut',
      description: 'Kệ sách gỗ walnut cao cấp, thiết kế nhiều ngăn, phù hợp với không gian phòng đọc hoặc phòng làm việc.',
      price: 4200000,
      stock: 5,
      productType: 'furniture', // Updated from category to productType
      categoryId: categoryMap['Nội thất'],
      imageUrl: 'https://example.com/images/walnut-bookshelf.jpg'
    },
    {
      name: 'Đồng hồ treo tường gỗ',
      description: 'Đồng hồ treo tường làm từ gỗ teak, thiết kế tối giản, kim giờ và phút bằng đồng.',
      price: 850000,
      stock: 20,
      productType: 'decoration', // Updated from category to productType
      categoryId: categoryMap['Đồ trang trí'],
      imageUrl: 'https://example.com/images/wooden-clock.jpg'
    },
    {
      name: 'Khung ảnh gỗ thủ công',
      description: 'Khung ảnh gỗ thủ công, chạm khắc hoa văn tinh tế, kích thước 20x30cm.',
      price: 350000,
      stock: 25,
      productType: 'decoration', // Updated from category to productType
      categoryId: categoryMap['Đồ trang trí'],
      imageUrl: 'https://example.com/images/wooden-frame.jpg'
    },
    {
      name: 'Bàn ngoài trời gỗ teak',
      description: 'Bàn ngoài trời làm từ gỗ teak chống nước, chống mối mọt, phù hợp cho sân vườn hoặc ban công.',
      price: 2800000,
      stock: 10,
      productType: 'outdoor', // Updated from category to productType
      categoryId: categoryMap['Ngoại thất'],
      imageUrl: 'https://example.com/images/teak-outdoor-table.jpg'
    },
    {
      name: 'Ghế xích đu gỗ ngoài trời',
      description: 'Ghế xích đu gỗ keo chống nước, bao gồm đệm ngồi, phù hợp cho sân vườn và khu vui chơi.',
      price: 1900000,
      stock: 7,
      productType: 'outdoor', // Updated from category to productType
      categoryId: categoryMap['Ngoại thất'],
      imageUrl: 'https://example.com/images/wooden-swing.jpg'
    },
    {
      name: 'Đế lót ly gỗ sồi',
      description: 'Bộ 6 đế lót ly làm từ gỗ sồi, thiết kế đơn giản, bảo vệ mặt bàn khỏi vết nước.',
      price: 120000,
      stock: 50,
      productType: 'accessories', // Updated from category to productType
      categoryId: categoryMap['Phụ kiện'],
      imageUrl: 'https://example.com/images/oak-coasters.jpg'
    },
    {
      name: 'Hộp đựng trang sức gỗ thủ công',
      description: 'Hộp đựng trang sức làm từ gỗ hương với các ngăn riêng biệt và gương nhỏ bên trong.',
      price: 680000,
      stock: 15,
      productType: 'accessories', // Updated from category to productType
      categoryId: categoryMap['Phụ kiện'],
      imageUrl: 'https://example.com/images/wooden-jewelry-box.jpg'
    },
    {
      name: 'Tủ quần áo gỗ tự nhiên',
      description: 'Tủ quần áo 3 cánh làm từ gỗ tự nhiên, thiết kế hiện đại với nhiều ngăn kéo và không gian treo.',
      price: 8500000,
      stock: 3,
      productType: 'furniture', // Updated from category to productType
      categoryId: categoryMap['Nội thất'],
      imageUrl: 'https://example.com/images/wooden-wardrobe.jpg'
    }
  ];

  try {
    for (const productData of products) {
      await Product.create(productData);
    }
    console.log(`✅ Đã tạo ${products.length} sản phẩm mẫu`);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu sản phẩm:', error);
  }
};

// Chạy hàm chính
syncDatabase();