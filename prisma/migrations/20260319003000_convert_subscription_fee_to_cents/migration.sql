-- Convert existing creator subscriptionFee values from whole euros to cents
-- Example: 9 -> 900, 25 -> 2500
UPDATE `Creator`
SET `subscriptionFee` = `subscriptionFee` * 100
WHERE `subscriptionFee` > 0 AND `subscriptionFee` < 100000;
