-- AlterTable: Add Stripe fields to Creator
ALTER TABLE `Creator`
    ADD COLUMN `stripePriceId` VARCHAR(191) NULL,
    ADD COLUMN `stripeProductId` VARCHAR(191) NULL,
    ADD COLUMN `stripeAccountId` VARCHAR(191) NULL,
    ADD COLUMN `stripeOnboardingComplete` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `availableBalance` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pendingBalance` INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add Stripe fields to Subscription
ALTER TABLE `Subscription`
    ADD COLUMN `stripeSubscriptionId` VARCHAR(191) NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL;

ALTER TABLE `Subscription`
    ADD UNIQUE INDEX `Subscription_stripeSubscriptionId_key`(`stripeSubscriptionId`);

-- AlterTable: Add stripeId to Transaction and extend the type enum
ALTER TABLE `Transaction`
    ADD COLUMN `stripeId` VARCHAR(191) NULL,
    MODIFY COLUMN `type` ENUM('SUBSCRIPTION_PAYMENT','WITHDRAWAL','DEPOSIT','REFUND','TRANSFER','CREATOR_EARNING','PLATFORM_FEE','PAYOUT') NOT NULL;
