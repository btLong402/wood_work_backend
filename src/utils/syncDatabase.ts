import { sequelize } from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import Permission from '../models/Permission';
import Address from '../models/Address';
import WoodSpecies from '../models/WoodSpecies';
import WoodLot from '../models/WoodLot';
import Transaction from '../models/Transaction';
import ActivityLog from '../models/ActivityLog';
import Notification from '../models/Notification';
import File from '../models/File';
import Token from '../models/Token';
import RolePermission from '../models/RolePermission';

// Extend the global NodeJS namespace to include our custom property
declare global {
  namespace NodeJS {
    interface Global {
      roleIds: Record<string, string>;
      permissionIds: Record<string, string>;
      speciesIds: Record<string, string>;
      userIds: Record<string, string>;
    }
  }
}

const syncDatabase = async (): Promise<void> => {
  try {
    console.log('Starting database sync...');
    
    // Parse command line arguments
    const args = process.argv;
    
    // Check for flags anywhere in the arguments
    const forceSync = args.includes('--force');
    const alterSync = !forceSync && args.includes('--alter');
    const seedData = args.includes('--seed');
    
    // Determine sync options (force takes precedence over alter)
    let syncOptions = {};
    if (forceSync) {
      console.log('⚠️ WARNING: Running with --force flag. All data will be lost!');
      syncOptions = { force: true };
    } else if (alterSync) {
      console.log('Running with --alter flag. Table structure will be updated.');
      syncOptions = { alter: true };
    } else {
      console.log('Running in safe mode (no structure changes).');
    }
    
    // Perform single sync operation with determined options
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully.');
    
    // Create sample data if --seed flag is provided
    if (seedData) {
      console.log('Generating sample data...');
      try {
        await createSampleData();
        console.log('✅ Sample data created successfully.');
      } catch (error) {
        console.error('❌ Error creating sample data:', error);
      }
    }
    
    console.log('✅ All database operations completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
};

const createSampleData = async (): Promise<void> => {
  // Tạo dữ liệu mẫu cho từng model - theo thứ tự phù hợp với các quan hệ
  await createRolesAndPermissions();
  await createAddresses();
  await createUsers();
  await createWoodSpecies();
  await createWoodLots();
  await createTransactions();
  await createActivityLogs();
  await createNotifications();
};

const createRolesAndPermissions = async (): Promise<void> => {
  console.log('Tạo dữ liệu vai trò và quyền hạn mẫu...');
  
  // Tạo quyền hạn
  const permissions = [
    { name: 'user:read' },
    { name: 'user:create' },
    { name: 'user:update' },
    { name: 'user:delete' },
    { name: 'wood_lot:read' },
    { name: 'wood_lot:create' },
    { name: 'wood_lot:update' },
    { name: 'wood_lot:delete' },
    { name: 'transaction:read' },
    { name: 'transaction:create' },
    { name: 'transaction:update' },
    { name: 'transaction:delete' },
    { name: 'transaction:approve' }
  ];

  // Tạo vai trò
  const roles = [
    { name: 'admin' },
    { name: 'user' },
    { name: 'manager' }
  ];

  // Bản đồ phân quyền (roleName -> permissionNames[])
  const rolePermissionsMap: Record<string, string[]> = {
    'admin': permissions.map(p => p.name),
    'manager': [
      'user:read', 'wood_lot:read', 'wood_lot:create', 'wood_lot:update',
      'transaction:read', 'transaction:create', 'transaction:update', 'transaction:approve'
    ],
    'user': [
      'user:read', 'wood_lot:read', 'transaction:read', 'transaction:create'
    ]
  };

  try {
    // Lưu ID quyền hạn để liên kết với vai trò sau này
    const permissionMap: Record<string, string> = {};
    for (const permissionData of permissions) {
      const permission = await Permission.create(permissionData);
      permissionMap[permissionData.name] = permission.id;
    }
    console.log(`✅ Đã tạo ${permissions.length} quyền hạn mẫu`);
    
    // Lưu ID vai trò để liên kết với người dùng sau này
    const roleMap: Record<string, string> = {};
    for (const roleData of roles) {
      const role = await Role.create(roleData);
      roleMap[roleData.name] = role.id;

      // Thêm quyền hạn cho vai trò
      if (rolePermissionsMap[roleData.name]) {
        for (const permissionName of rolePermissionsMap[roleData.name]) {
          if (permissionMap[permissionName]) {
            await RolePermission.create({
              roleId: role.id,
              permissionId: permissionMap[permissionName]
            });
          }
        }
      }
    }
    console.log(`✅ Đã tạo ${roles.length} vai trò mẫu và phân quyền tương ứng`);
    
    // Lưu ID vai trò và quyền hạn vào global để sử dụng sau
    (global as any).roleIds = roleMap;
    (global as any).permissionIds = permissionMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu vai trò và quyền hạn:', error);
  }
};

const createAddresses = async (): Promise<void> => {
  console.log('Tạo dữ liệu địa chỉ mẫu...');
  
  const addresses = [
    {
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      commune: 'Dịch Vọng Hậu',
      details: 'Số 1 Đường Trần Thái Tông'
    },
    {
      province: 'TP Hồ Chí Minh',
      district: 'Quận 1',
      commune: 'Bến Nghé',
      details: 'Số 123 Đường Lê Lợi'
    },
    {
      province: 'Đà Nẵng',
      district: 'Hải Châu',
      commune: 'Hải Châu 1',
      details: 'Số 45 Đường Lê Duẩn'
    },
    {
      province: 'Hải Phòng',
      district: 'Hồng Bàng',
      commune: 'Quán Toan',
      details: 'Số 67 Đường Lạch Tray'
    },
    {
      province: 'Cần Thơ',
      district: 'Ninh Kiều',
      commune: 'Tân An',
      details: 'Số 89 Đường 30/4'
    }
  ];

  // Lưu ID địa chỉ để liên kết với người dùng sau này
  const addressMap: Record<string, string> = {};

  try {
    for (let i = 0; i < addresses.length; i++) {
      const address = await Address.create(addresses[i]);
      addressMap[`address${i+1}`] = address.id;
    }
    console.log(`✅ Đã tạo ${addresses.length} địa chỉ mẫu`);
    
    // Lưu ID địa chỉ vào global để sử dụng sau
    (global as any).addressIds = addressMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu địa chỉ:', error);
  }
};

const createUsers = async (): Promise<void> => {
  console.log('Tạo dữ liệu người dùng mẫu...');
  
  const roleIds = (global as any).roleIds || {
    'admin': '',
    'user': '',
    'manager': ''
  };
  
  const addressIds = (global as any).addressIds || {
    'address1': '',
    'address2': '',
    'address3': '',
    'address4': '',
    'address5': ''
  };

  const users = [
    {
      username: 'admin',
      password: 'Admin@123',
      fullName: 'Admin User',
      email: 'admin@woodwork.com',
      phone: '0901234567',
      roleId: roleIds['admin'],
      addressId: addressIds['address1']
    },
    {
      username: 'user1',
      password: 'User@123',
      fullName: 'Regular User',
      email: 'user@woodwork.com',
      phone: '0912345678',
      roleId: roleIds['user'],
      addressId: addressIds['address2']
    },
    {
      username: 'johndoe',
      password: 'Password123',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '0923456789',
      roleId: roleIds['user'],
      addressId: addressIds['address3']
    },
    {
      username: 'janesmith',
      password: 'Password123',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0934567890',
      roleId: roleIds['user'],
      addressId: addressIds['address4']
    },
    {
      username: 'manager',
      password: 'Manager@123',
      fullName: 'Manager User',
      email: 'manager@woodwork.com',
      phone: '0945678901',
      roleId: roleIds['manager'],
      addressId: addressIds['address5']
    }
  ];

  try {
    // Lưu ID người dùng để liên kết với các bảng khác sau này
    const userMap: Record<string, string> = {};
    for (const userData of users) {
      const user = await User.create(userData);
      userMap[userData.username] = user.id;
    }
    console.log(`✅ Đã tạo ${users.length} người dùng mẫu`);
    
    // Lưu ID người dùng vào global để sử dụng sau
    (global as any).userIds = userMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu người dùng:', error);
  }
};

const createWoodSpecies = async (): Promise<void> => {
  console.log('Tạo dữ liệu loài gỗ mẫu...');
  
  type ConservationStatus = 'Common' | 'Rare' | 'CITES I/II' | 'Endangered';
  
  const woodSpecies = [
    {
      scientificName: 'Quercus alba',
      commonName: 'Gỗ sồi trắng',
      conservationStatus: 'Common' as ConservationStatus
    },
    {
      scientificName: 'Tectona grandis',
      commonName: 'Gỗ teak',
      conservationStatus: 'Rare' as ConservationStatus
    },
    {
      scientificName: 'Swietenia mahagoni',
      commonName: 'Gỗ mahogany',
      conservationStatus: 'CITES I/II' as ConservationStatus
    },
    {
      scientificName: 'Juglans nigra',
      commonName: 'Gỗ óc chó đen',
      conservationStatus: 'Common' as ConservationStatus
    },
    {
      scientificName: 'Dalbergia latifolia',
      commonName: 'Gỗ hương',
      conservationStatus: 'Endangered' as ConservationStatus
    },
    {
      scientificName: 'Pinus sylvestris',
      commonName: 'Gỗ thông',
      conservationStatus: 'Common' as ConservationStatus
    },
    {
      scientificName: 'Acacia mangium',
      commonName: 'Gỗ keo',
      conservationStatus: 'Common' as ConservationStatus
    }
  ];

  try {
    // Lưu ID loài gỗ để liên kết với lô gỗ sau này
    const speciesMap: Record<string, string> = {};
    for (const speciesData of woodSpecies) {
      const species = await WoodSpecies.create(speciesData);
      speciesMap[speciesData.commonName] = species.id;
    }
    console.log(`✅ Đã tạo ${woodSpecies.length} loài gỗ mẫu`);
    
    // Lưu ID loài gỗ vào global để sử dụng sau
    (global as any).speciesIds = speciesMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu loài gỗ:', error);
  }
};

const createWoodLots = async (): Promise<void> => {
  console.log('Tạo dữ liệu lô gỗ mẫu...');
  
  const speciesIds = (global as any).speciesIds || {};
  const userIds = (global as any).userIds || {};
  
  type Quality = 'High' | 'Medium' | 'Low';
  
  const woodLots = [
    {
      speciesId: speciesIds['Gỗ sồi trắng'],
      origin: 'Yên Bái, Việt Nam',
      quantity: 12.5,
      unit: 'm³',
      quality: 'High' as Quality,
      harvestDate: new Date('2024-10-15'),
      createdById: userIds['admin']
    },
    {
      speciesId: speciesIds['Gỗ teak'],
      origin: 'Myanmar',
      quantity: 8.2,
      unit: 'm³',
      quality: 'High' as Quality,
      harvestDate: new Date('2024-09-20'),
      createdById: userIds['manager']
    },
    {
      speciesId: speciesIds['Gỗ mahogany'],
      origin: 'Philippines',
      quantity: 6.7,
      unit: 'm³',
      quality: 'Medium' as Quality,
      harvestDate: new Date('2024-11-05'),
      createdById: userIds['johndoe']
    },
    {
      speciesId: speciesIds['Gỗ óc chó đen'],
      origin: 'Hòa Bình, Việt Nam',
      quantity: 9.3,
      unit: 'm³',
      quality: 'Medium' as Quality,
      harvestDate: new Date('2024-08-12'),
      createdById: userIds['admin']
    },
    {
      speciesId: speciesIds['Gỗ hương'],
      origin: 'Quảng Nam, Việt Nam',
      quantity: 5.8,
      unit: 'm³',
      quality: 'High' as Quality,
      harvestDate: new Date('2024-07-28'),
      createdById: userIds['manager']
    },
    {
      speciesId: speciesIds['Gỗ thông'],
      origin: 'Lâm Đồng, Việt Nam',
      quantity: 15.4,
      unit: 'm³',
      quality: 'Low' as Quality,
      harvestDate: new Date('2024-12-01'),
      createdById: userIds['janesmith']
    },
    {
      speciesId: speciesIds['Gỗ keo'],
      origin: 'Bình Dương, Việt Nam',
      quantity: 30.2,
      unit: 'm³',
      quality: 'Medium' as Quality,
      harvestDate: new Date('2024-10-30'),
      createdById: userIds['user1']
    }
  ];

  try {
    // Lưu ID lô gỗ để liên kết với giao dịch sau này
    const woodLotMap: Record<string, string> = {};
    for (let i = 0; i < woodLots.length; i++) {
      const woodLot = await WoodLot.create(woodLots[i]);
      woodLotMap[`woodLot${i+1}`] = woodLot.id;
    }
    console.log(`✅ Đã tạo ${woodLots.length} lô gỗ mẫu`);
    
    // Lưu ID lô gỗ vào global để sử dụng sau
    (global as any).woodLotIds = woodLotMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu lô gỗ:', error);
  }
};

const createTransactions = async (): Promise<void> => {
  console.log('Tạo dữ liệu giao dịch mẫu...');
  
  const woodLotIds = (global as any).woodLotIds || {};
  const userIds = (global as any).userIds || {};
  
  type TransactionStatus = 'Completed' | 'Pending' | 'Approved' | 'Cancelled';
  
  const transactions = [
    {
      woodLotId: woodLotIds['woodLot1'],
      buyerId: userIds['janesmith'],
      sellerId: userIds['admin'],
      price: 32500000,
      transactionDate: new Date('2024-10-20'),
      status: 'Completed' as TransactionStatus,
      createdById: userIds['admin']
    },
    {
      woodLotId: woodLotIds['woodLot2'],
      buyerId: userIds['johndoe'],
      sellerId: userIds['manager'],
      price: 28700000,
      transactionDate: new Date('2024-09-25'),
      status: 'Completed' as TransactionStatus,
      createdById: userIds['manager']
    },
    {
      woodLotId: woodLotIds['woodLot3'],
      buyerId: userIds['user1'],
      sellerId: userIds['johndoe'],
      price: 19500000,
      transactionDate: new Date(),
      status: 'Pending' as TransactionStatus,
      createdById: userIds['johndoe']
    },
    {
      woodLotId: woodLotIds['woodLot4'],
      buyerId: userIds['admin'],
      sellerId: userIds['janesmith'],
      price: 15800000,
      transactionDate: new Date(),
      status: 'Approved' as TransactionStatus,
      createdById: userIds['janesmith']
    },
    {
      woodLotId: woodLotIds['woodLot5'],
      buyerId: userIds['manager'],
      sellerId: userIds['admin'],
      price: 42000000,
      transactionDate: new Date(),
      status: 'Pending' as TransactionStatus,
      createdById: userIds['admin']
    }
  ];

  try {
    // Lưu ID giao dịch để liên kết với các bảng khác sau này
    const transactionMap: Record<string, string> = {};
    for (let i = 0; i < transactions.length; i++) {
      const transaction = await Transaction.create(transactions[i]);
      transactionMap[`transaction${i+1}`] = transaction.id;
    }
    console.log(`✅ Đã tạo ${transactions.length} giao dịch mẫu`);
    
    // Lưu ID giao dịch vào global để sử dụng sau
    (global as any).transactionIds = transactionMap;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu giao dịch:', error);
  }
};

const createActivityLogs = async (): Promise<void> => {
  console.log('Tạo dữ liệu nhật ký hoạt động mẫu...');
  
  const userIds = (global as any).userIds || {};
  const woodLotIds = (global as any).woodLotIds || {};
  const transactionIds = (global as any).transactionIds || {};
  
  // Define the correct type for action
  type ActivityLogAction = 'add' | 'approve' | 'edit' | 'delete' | 'submit' | 'view';
  
  const activityLogs = [
    {
      userId: userIds['admin'],
      action: 'add' as ActivityLogAction,
      entityType: 'wood_lot',
      entityId: woodLotIds['woodLot1'],
      message: 'Thêm mới lô gỗ sồi trắng',
      timestamp: new Date('2024-10-15T09:30:00'),
      ipAddress: '192.168.1.100'
    },
    {
      userId: userIds['manager'],
      action: 'add' as ActivityLogAction,
      entityType: 'wood_lot',
      entityId: woodLotIds['woodLot2'],
      message: 'Thêm mới lô gỗ teak',
      timestamp: new Date('2024-09-20T14:15:00'),
      ipAddress: '192.168.1.101'
    },
    {
      userId: userIds['admin'],
      action: 'approve' as ActivityLogAction,
      entityType: 'transaction',
      entityId: transactionIds['transaction1'],
      message: 'Phê duyệt giao dịch mua bán lô gỗ sồi trắng',
      timestamp: new Date('2024-10-18T10:45:00'),
      ipAddress: '192.168.1.102'
    },
    {
      userId: userIds['manager'],
      action: 'edit' as ActivityLogAction,
      entityType: 'wood_lot',
      entityId: woodLotIds['woodLot5'],
      message: 'Cập nhật thông tin lô gỗ hương',
      timestamp: new Date('2024-07-29T16:20:00'),
      ipAddress: '192.168.1.103'
    },
    {
      userId: userIds['johndoe'],
      action: 'add' as ActivityLogAction,
      entityType: 'transaction',
      entityId: transactionIds['transaction3'],
      message: 'Tạo giao dịch mua bán lô gỗ mahogany',
      timestamp: new Date(),
      ipAddress: '192.168.1.104'
    }
  ];

  try {
    for (const logData of activityLogs) {
      await ActivityLog.create(logData);
    }
    console.log(`✅ Đã tạo ${activityLogs.length} nhật ký hoạt động mẫu`);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu nhật ký hoạt động:', error);
  }
};

const createNotifications = async (): Promise<void> => {
  console.log('Tạo dữ liệu thông báo mẫu...');
  
  const userIds = (global as any).userIds || {};
  const transactionIds = (global as any).transactionIds || {};
  const woodLotIds = (global as any).woodLotIds || {};
  
  // Define the allowed entity types
  type NotificationEntityType = 'wood_lot' | 'transaction' | 'user';
  
  const notifications = [
    {
      content: 'Giao dịch mua bán lô gỗ sồi trắng của bạn đã được phê duyệt',
      senderId: userIds['admin'],
      receiverId: userIds['janesmith'],
      entityId: transactionIds['transaction1'],
      entityType: 'transaction' as NotificationEntityType,
      isRead: true,
      createdAt: new Date('2024-10-18T10:46:00')
    },
    {
      content: 'Giao dịch mua bán lô gỗ teak của bạn đã được phê duyệt',
      senderId: userIds['manager'],
      receiverId: userIds['johndoe'],
      entityId: transactionIds['transaction2'],
      entityType: 'transaction' as NotificationEntityType,
      isRead: true,
      createdAt: new Date('2024-09-25T15:30:00')
    },
    {
      content: 'Bạn có một yêu cầu giao dịch mua lô gỗ mahogany mới',
      senderId: userIds['user1'],
      receiverId: userIds['johndoe'],
      entityId: transactionIds['transaction3'],
      entityType: 'transaction' as NotificationEntityType,
      isRead: false,
      createdAt: new Date()
    },
    {
      content: 'Giao dịch mua bán lô gỗ óc chó đen của bạn đã được phê duyệt',
      senderId: userIds['admin'],
      receiverId: userIds['janesmith'],
      entityId: transactionIds['transaction4'],
      entityType: 'transaction' as NotificationEntityType,
      isRead: false,
      createdAt: new Date()
    },
    {
      content: 'Lô gỗ hương mới đã được đăng ký trong hệ thống',
      senderId: userIds['manager'],
      receiverId: userIds['admin'],
      entityId: woodLotIds['woodLot5'],
      entityType: 'wood_lot' as NotificationEntityType,
      isRead: false,
      createdAt: new Date('2024-07-28T16:30:00')
    }
  ];

  try {
    for (const notificationData of notifications) {
      await Notification.create(notificationData);
    }
    console.log(`✅ Đã tạo ${notifications.length} thông báo mẫu`);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu thông báo:', error);
  }
};

// Chạy hàm chính
syncDatabase();