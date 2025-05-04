-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  department VARCHAR(100),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an admin user (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@gudangmitra.com', '$2a$10$zXEQLTI6JASt8XqP8.W5IOcxxdQxZmGBSLKNXxKR9rQjOQRnIdKRa', 'admin');

-- Item Requests Table
CREATE TABLE item_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample Data for Inventory
INSERT INTO inventory (item_name, quantity, category, location)
VALUES 
  ('Printer Paper', 50, 'Office', 'Warehouse A'),
  ('Whiteboard Markers', 100, 'Office', 'Warehouse A'),
  ('Cleaning Supplies', 20, 'Cleaning', 'Warehouse B'),
  ('Laptop Charger', 15, 'Hardware', 'Warehouse C');

-- Sample Data for Notifications (assuming admin user ID is available)
INSERT INTO notifications (user_id, message, read, type)
SELECT 
  id, 
  'Welcome to Gudang Mitra!', 
  false, 
  'welcome'
FROM users 
WHERE email = 'admin@gudangmitra.com';
