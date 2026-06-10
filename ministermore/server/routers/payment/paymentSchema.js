const { servicedb } = require('../dbdatas/servicedb');

let ensured = false;

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    servicedb.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

const CREATE_BILLING_TABLE = `
CREATE TABLE IF NOT EXISTS billingPayment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  serviceType VARCHAR(64) NOT NULL,
  userAccount VARCHAR(255) NULL,
  churchName VARCHAR(255) NULL,
  ordererName VARCHAR(120) NULL,
  ordererPhone VARCHAR(40) NULL,
  orderTitle VARCHAR(255) NULL,
  orderName VARCHAR(255) NULL,
  supplyAmount INT NULL,
  vatAmount INT NULL,
  totalAmount INT NOT NULL,
  portonePaymentId VARCHAR(255) NOT NULL,
  schedulePaymentId VARCHAR(255) NULL,
  billingKey VARCHAR(512) NULL,
  portoneScheduleId VARCHAR(255) NULL,
  portonePaidAt VARCHAR(64) NULL,
  portoneTimeToPay VARCHAR(64) NULL,
  plan VARCHAR(32) NULL DEFAULT 'monthly',
  paymentStatus VARCHAR(32) NOT NULL DEFAULT 'PAID',
  resourceType VARCHAR(64) NULL,
  resourceId VARCHAR(64) NULL,
  customData JSON NULL,
  memo TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_billing_portonePaymentId (portonePaymentId),
  KEY idx_billing_serviceType (serviceType),
  KEY idx_billing_userAccount (userAccount),
  KEY idx_billing_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

const CREATE_ONETIME_TABLE = `
CREATE TABLE IF NOT EXISTS oneTimePayment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  serviceType VARCHAR(64) NOT NULL,
  userAccount VARCHAR(255) NULL,
  churchName VARCHAR(255) NULL,
  ordererName VARCHAR(120) NULL,
  ordererPhone VARCHAR(40) NULL,
  orderTitle VARCHAR(255) NULL,
  orderName VARCHAR(255) NULL,
  supplyAmount INT NULL,
  vatAmount INT NULL,
  totalAmount INT NOT NULL,
  portonePaymentId VARCHAR(255) NOT NULL,
  portoneTxId VARCHAR(64) NULL,
  portonePaidAt VARCHAR(64) NULL,
  paymentStatus VARCHAR(32) NOT NULL DEFAULT 'PAID',
  resourceType VARCHAR(64) NULL,
  resourceId VARCHAR(64) NULL,
  customData JSON NULL,
  memo TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_onetime_portonePaymentId (portonePaymentId),
  KEY idx_onetime_serviceType (serviceType),
  KEY idx_onetime_userAccount (userAccount),
  KEY idx_onetime_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

async function ensurePaymentTables() {
  if (ensured) return;
  await queryAsync(CREATE_BILLING_TABLE);
  await queryAsync(CREATE_ONETIME_TABLE);
  ensured = true;
}

module.exports = {
  ensurePaymentTables,
};
