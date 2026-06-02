const express = require('express');
const cors = require('cors');
const {
  createFinanceRecord,
  getFinanceRecordList,
  getFinanceSummary,
  getRecurringExpenseList,
  createRecurringExpense,
  patchRecurringExpense,
} = require('./financeController');

const router = express.Router();

router.use(cors());
router.use(express.json());

router.post('/finance', createFinanceRecord);
router.get('/finance/list', getFinanceRecordList);
router.get('/finance/summary', getFinanceSummary);
router.get('/finance/recurring', getRecurringExpenseList);
router.post('/finance/recurring', createRecurringExpense);
router.patch('/finance/recurring/:id', patchRecurringExpense);

module.exports = router;
