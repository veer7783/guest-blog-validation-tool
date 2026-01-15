-- ============================================
-- CONTRIBUTOR ROLE IMPLEMENTATION
-- Run these SQL queries in phpMyAdmin
-- Database: guest_blog_validation
-- ============================================

-- 1. Add CONTRIBUTOR and USER roles to users table
ALTER TABLE `users` 
MODIFY COLUMN `role` ENUM('ADMIN', 'SUPER_ADMIN', 'USER', 'CONTRIBUTOR') 
NOT NULL DEFAULT 'ADMIN';

-- 2. Add uploadedBy field to data_in_process table
ALTER TABLE `data_in_process` 
ADD COLUMN `uploadedBy` VARCHAR(191) NULL 
AFTER `keywords`;

-- 3. Add uploadedBy field to data_final table
ALTER TABLE `data_final` 
ADD COLUMN `uploadedBy` VARCHAR(191) NULL 
AFTER `keywords`;

-- 4. Add assignedAdminId field to users table (CRITICAL - This is missing!)
ALTER TABLE `users` 
ADD COLUMN `assignedAdminId` VARCHAR(191) NULL 
AFTER `isActive`;

-- ============================================
-- VERIFICATION QUERIES (Run after above queries)
-- ============================================

-- Check if role enum updated
SHOW COLUMNS FROM `users` WHERE Field = 'role';

-- Check if uploadedBy columns added
SHOW COLUMNS FROM `data_in_process` WHERE Field = 'uploadedBy';
SHOW COLUMNS FROM `data_final` WHERE Field = 'uploadedBy';

-- Check if assignedAdminId column added (IMPORTANT!)
SHOW COLUMNS FROM `users` WHERE Field = 'assignedAdminId';

-- View all users with their assigned admin
SELECT id, firstName, lastName, email, role, assignedAdminId, createdAt 
FROM users 
ORDER BY createdAt DESC;
