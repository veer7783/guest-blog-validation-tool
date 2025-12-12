# 💾 Database Schema Documentation

Complete database schema for Guest Blog Validation Tool.

---

## 📊 Database: `guest_blog_validation`

### Tables Overview:
1. `users` - User accounts and authentication
2. `data_management` - Initial CSV upload data
3. `data_final` - Validated data with pricing
4. `_prisma_migrations` - Migration history (auto-managed)

---

## 👥 Table: `users`

Stores user accounts with authentication and 2FA.

### Schema:
```sql
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN',
  `twoFactorSecret` VARCHAR(191) NULL,
  `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL
);
```

### Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(191) | Unique user ID (UUID) |
| `email` | VARCHAR(191) | User email (unique, used for login) |
| `password` | VARCHAR(191) | Hashed password (bcrypt) |
| `firstName` | VARCHAR(191) | User's first name |
| `lastName` | VARCHAR(191) | User's last name |
| `role` | ENUM | User role: `ADMIN` or `SUPER_ADMIN` |
| `twoFactorSecret` | VARCHAR(191) | 2FA secret key (optional) |
| `twoFactorEnabled` | BOOLEAN | Whether 2FA is enabled |
| `createdAt` | DATETIME | Account creation timestamp |
| `updatedAt` | DATETIME | Last update timestamp |

### Indexes:
- PRIMARY KEY: `id`
- UNIQUE: `email`

### Roles:
- **ADMIN**: Can view and manage data
- **SUPER_ADMIN**: Full access (push, users, etc.)

---

## 📋 Table: `data_management`

Stores initial CSV upload data before validation.

### Schema:
```sql
CREATE TABLE `data_management` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `websiteUrl` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `language` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `daRange` VARCHAR(191) NULL,
  `linkType` VARCHAR(191) NULL,
  `tat` VARCHAR(191) NULL,
  `publisherName` VARCHAR(191) NULL,
  `publisherEmail` VARCHAR(191) NULL,
  `publisherContact` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `da` INT NULL,
  `dr` INT NULL,
  `traffic` INT NULL,
  `ss` INT NULL,
  `reachedBy` VARCHAR(191) NULL,
  `reachedByName` VARCHAR(191) NULL,
  `reachedAt` DATETIME(3) NULL,
  `lastModifiedBy` VARCHAR(191) NULL,
  `lastModifiedByName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  FOREIGN KEY (`reachedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`lastModifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
```

### Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(191) | Unique record ID |
| `websiteUrl` | VARCHAR(191) | Website URL |
| `category` | VARCHAR(191) | Site category |
| `language` | VARCHAR(191) | Site language |
| `country` | VARCHAR(191) | Site country |
| `daRange` | VARCHAR(191) | Domain Authority range |
| `linkType` | VARCHAR(191) | Type of link |
| `tat` | VARCHAR(191) | Turn-around time |
| `publisherName` | VARCHAR(191) | Publisher name |
| `publisherEmail` | VARCHAR(191) | Publisher email |
| `publisherContact` | VARCHAR(191) | Publisher contact |
| `notes` | TEXT | Additional notes |
| `da` | INT | Domain Authority score |
| `dr` | INT | Domain Rating score |
| `traffic` | INT | Monthly traffic |
| `ss` | INT | Spam Score |
| `reachedBy` | VARCHAR(191) | User ID who reached out |
| `reachedByName` | VARCHAR(191) | User name (denormalized) |
| `reachedAt` | DATETIME | When reached out |
| `lastModifiedBy` | VARCHAR(191) | Last modifier user ID |
| `lastModifiedByName` | VARCHAR(191) | Last modifier name |
| `createdAt` | DATETIME | Record creation time |
| `updatedAt` | DATETIME | Last update time |

### Relationships:
- `reachedBy` → `users.id`
- `lastModifiedBy` → `users.id`

---

## ✅ Table: `data_final`

Stores validated data with pricing, ready for push to main project.

### Schema:
```sql
CREATE TABLE `data_final` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `websiteUrl` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `language` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `daRange` VARCHAR(191) NULL,
  `linkType` VARCHAR(191) NULL,
  `tat` VARCHAR(191) NULL,
  `publisherName` VARCHAR(191) NULL,
  `publisherEmail` VARCHAR(191) NULL,
  `publisherContact` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `da` INT NULL,
  `dr` INT NULL,
  `traffic` INT NULL,
  `ss` INT NULL,
  `gbBasePrice` DECIMAL(10,2) NULL,
  `liBasePrice` DECIMAL(10,2) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `negotiationStatus` ENUM('DONE', 'IN_PROGRESS') NOT NULL DEFAULT 'DONE',
  `reachedBy` VARCHAR(191) NULL,
  `reachedByName` VARCHAR(191) NULL,
  `reachedAt` DATETIME(3) NULL,
  `lastModifiedBy` VARCHAR(191) NULL,
  `lastModifiedByName` VARCHAR(191) NULL,
  `mainProjectId` VARCHAR(191) NULL,
  `pushedAt` DATETIME(3) NULL,
  `pushedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  FOREIGN KEY (`reachedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`lastModifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`pushedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
```

### Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(191) | Unique record ID |
| `websiteUrl` | VARCHAR(191) | Website URL |
| `category` | VARCHAR(191) | Site category |
| `language` | VARCHAR(191) | Site language |
| `country` | VARCHAR(191) | Site country |
| `daRange` | VARCHAR(191) | Domain Authority range |
| `linkType` | VARCHAR(191) | Type of link |
| `tat` | VARCHAR(191) | Turn-around time |
| `publisherName` | VARCHAR(191) | Publisher name |
| `publisherEmail` | VARCHAR(191) | Publisher email |
| `publisherContact` | VARCHAR(191) | Publisher contact |
| `notes` | TEXT | Additional notes |
| `da` | INT | Domain Authority score |
| `dr` | INT | Domain Rating score |
| `traffic` | INT | Monthly traffic |
| `ss` | INT | Spam Score |
| `gbBasePrice` | DECIMAL(10,2) | Guest Blog base price |
| `liBasePrice` | DECIMAL(10,2) | Link Insertion base price |
| `status` | ENUM | Site status: `ACTIVE` or `INACTIVE` |
| `negotiationStatus` | ENUM | `DONE` or `IN_PROGRESS` |
| `reachedBy` | VARCHAR(191) | User ID who reached out |
| `reachedByName` | VARCHAR(191) | User name (denormalized) |
| `reachedAt` | DATETIME | When reached out |
| `lastModifiedBy` | VARCHAR(191) | Last modifier user ID |
| `lastModifiedByName` | VARCHAR(191) | Last modifier name |
| `mainProjectId` | VARCHAR(191) | ID in main project (after push) |
| `pushedAt` | DATETIME | When pushed to main project |
| `pushedBy` | VARCHAR(191) | User ID who pushed |
| `createdAt` | DATETIME | Record creation time |
| `updatedAt` | DATETIME | Last update time |

### Relationships:
- `reachedBy` → `users.id`
- `lastModifiedBy` → `users.id`
- `pushedBy` → `users.id`

### Important Fields:
- **`mainProjectId`**: NULL = not pushed, NOT NULL = pushed
- **`pushedAt`**: Timestamp of push to main project
- **`pushedBy`**: User who performed the push

---

## 🔄 Data Flow

```
1. CSV Upload
   ↓
2. data_management (initial data)
   ↓
3. Validation & Pricing
   ↓
4. data_final (ready to push)
   ↓
5. Push to Main Project
   ↓
6. mainProjectId populated
   ↓
7. Appears in Pushed Data page
```

---

## 📝 Migrations

### Create New Migration:
```bash
cd backend
npx prisma migrate dev --name description_of_change
```

### Apply Migrations (Production):
```bash
npx prisma migrate deploy
```

### Reset Database (Development Only):
```bash
npx prisma migrate reset
```

---

## 🔍 Useful Queries

### Check Unpushed Sites:
```sql
SELECT COUNT(*) as unpushed_count 
FROM data_final 
WHERE mainProjectId IS NULL;
```

### Check Pushed Sites:
```sql
SELECT COUNT(*) as pushed_count 
FROM data_final 
WHERE mainProjectId IS NOT NULL;
```

### Recent Pushes:
```sql
SELECT df.websiteUrl, df.pushedAt, u.firstName, u.lastName
FROM data_final df
LEFT JOIN users u ON df.pushedBy = u.id
WHERE df.mainProjectId IS NOT NULL
ORDER BY df.pushedAt DESC
LIMIT 10;
```

### User Activity:
```sql
SELECT 
  u.email,
  COUNT(DISTINCT dm.id) as data_management_records,
  COUNT(DISTINCT df.id) as data_final_records,
  COUNT(DISTINCT dfp.id) as pushed_records
FROM users u
LEFT JOIN data_management dm ON dm.reachedBy = u.id
LEFT JOIN data_final df ON df.reachedBy = u.id
LEFT JOIN data_final dfp ON dfp.pushedBy = u.id
GROUP BY u.id;
```

---

## 🔐 Security Notes

1. **Passwords**: Hashed with bcrypt (10 rounds)
2. **2FA Secrets**: Encrypted in database
3. **Foreign Keys**: ON DELETE SET NULL (preserve data)
4. **Indexes**: Optimized for common queries
5. **Timestamps**: Automatic audit trail

---

## 📊 Database Size Estimates

| Records | Approx Size |
|---------|-------------|
| 1,000 sites | ~5 MB |
| 10,000 sites | ~50 MB |
| 100,000 sites | ~500 MB |

---

## 🔧 Maintenance

### Backup Database:
```bash
mysqldump -u user -p guest_blog_validation > backup.sql
```

### Restore Database:
```bash
mysql -u user -p guest_blog_validation < backup.sql
```

### Optimize Tables:
```sql
OPTIMIZE TABLE users, data_management, data_final;
```

---

**Last Updated:** December 2, 2024
