-- Ensure uploadedBy column exists in data_in_process table
ALTER TABLE `data_in_process` 
ADD COLUMN IF NOT EXISTS `uploadedBy` VARCHAR(191) NULL;

-- Ensure uploadedBy column exists in data_final table
ALTER TABLE `data_final` 
ADD COLUMN IF NOT EXISTS `uploadedBy` VARCHAR(191) NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS `data_in_process_uploadedBy_idx` ON `data_in_process`(`uploadedBy`);
CREATE INDEX IF NOT EXISTS `data_final_uploadedBy_idx` ON `data_final`(`uploadedBy`);
