-- Tạo cơ sở dữ liệu với bộ ký tự và đối chiếu phù hợp
CREATE DATABASE forest_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE forest_management;

-- Bảng địa chỉ để chuẩn hóa dữ liệu địa chỉ
CREATE TABLE addresses (
    id CHAR(36) NOT NULL,
    province VARCHAR(100),
    district VARCHAR(100),
    commune VARCHAR(100),
    details TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Bảng vai trò để định nghĩa các vai trò người dùng
CREATE TABLE roles (
    id CHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY roles_name_unique (name)
);

-- Bảng quyền hạn (tùy chọn, để quản lý quyền chi tiết)
CREATE TABLE permissions (
    id CHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY permissions_name_unique (name)
);

-- Bảng liên kết vai trò và quyền hạn (tùy chọn)
CREATE TABLE role_permissions (
    roleId CHAR(36) NOT NULL,
    permissionId CHAR(36) NOT NULL,
    PRIMARY KEY (roleId, permissionId),
    CONSTRAINT role_permissions_roleId_fk FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT role_permissions_permissionId_fk FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng người dùng để lưu thông tin người dùng
CREATE TABLE users (
    id CHAR(36) NOT NULL,
    username VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(200),
    phone VARCHAR(15),
    email VARCHAR(50),
    addressId CHAR(36),
    roleId CHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isActive TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY users_username_unique (username),
    CONSTRAINT users_addressId_addresses_id_fk FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT users_roleId_roles_id_fk FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng loài gỗ để lưu thông tin về các loại gỗ
CREATE TABLE wood_species (
    id CHAR(36) NOT NULL,
    scientificName VARCHAR(200) NOT NULL,
    commonName VARCHAR(200),
    conservationStatus ENUM('Common', 'Endangered', 'Rare', 'CITES I/II') DEFAULT 'Common',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY wood_species_scientificName_unique (scientificName)
);

-- Bảng lô gỗ để lưu thông tin chi tiết về các lô gỗ
CREATE TABLE wood_lots (
    id CHAR(36) NOT NULL,
    speciesId CHAR(36),
    origin VARCHAR(255),
    quantity FLOAT NOT NULL,
    unit VARCHAR(20) DEFAULT 'm³',
    quality ENUM('High', 'Medium', 'Low'),
    harvestDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdById CHAR(36),
    PRIMARY KEY (id),
    CONSTRAINT wood_lots_speciesId_wood_species_id_fk FOREIGN KEY (speciesId) REFERENCES wood_species(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT wood_lots_createdById_users_id_fk FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng giao dịch để ghi nhận thông tin mua bán gỗ
CREATE TABLE transactions (
    id CHAR(36) NOT NULL,
    woodLotId CHAR(36),
    buyerId CHAR(36),
    sellerId CHAR(36),
    price DECIMAL(15,2),
    transactionDate TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Completed', 'Cancelled') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdById CHAR(36),
    PRIMARY KEY (id),
    CONSTRAINT transactions_woodLotId_wood_lots_id_fk FOREIGN KEY (woodLotId) REFERENCES wood_lots(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT transactions_buyerId_users_id_fk FOREIGN KEY (buyerId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT transactions_sellerId_users_id_fk FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT transactions_createdById_users_id_fk FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng file để lưu trữ các tệp đính kèm
CREATE TABLE files (
    id CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    filetype VARCHAR(100),
    filesize INT,
    entityId CHAR(36) NOT NULL,
    entityType VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdById CHAR(36),
    PRIMARY KEY (id),
    CONSTRAINT files_createdById_users_id_fk FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng tài liệu giao dịch để liên kết tài liệu với giao dịch
CREATE TABLE transaction_documents (
    id CHAR(36) NOT NULL,
    transactionId CHAR(36) NOT NULL,
    documentType ENUM('Receipt', 'Contract', 'Other') NOT NULL,
    fileId CHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT transaction_docs_transactionId_transactions_id_fk FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT transaction_docs_fileId_files_id_fk FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng thông báo để lưu thông báo hệ thống
CREATE TABLE notifications (
    id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    senderId CHAR(36),
    receiverId CHAR(36),
    entityId CHAR(36),
    entityType ENUM('transaction', 'wood_lot', 'user') NOT NULL,
    isRead TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT notifications_senderId_users_id_fk FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT notifications_receiverId_users_id_fk FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng nhật ký hoạt động để ghi lại hoạt động của người dùng
CREATE TABLE activity_logs (
    id CHAR(36) NOT NULL,
    userId CHAR(36),
    action ENUM('add', 'edit', 'delete', 'approve', 'submit', 'view'),
    entityType VARCHAR(50) NOT NULL,
    entityId CHAR(36),
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    PRIMARY KEY (id),
    CONSTRAINT activity_logs_userId_users_id_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Bảng token để lưu trữ token xác thực
CREATE TABLE tokens (
    id CHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL,
    userId CHAR(36),
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT tokens_userId_users_id_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);