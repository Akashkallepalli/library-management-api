const moment = require('moment');
const { v4: uuidv4, validate: validateUUID } = require('uuid');
const { BUSINESS_RULES, PAGINATION } = require('./constants');

const calculateDueDate = (borrowedAt) =>
  moment(borrowedAt).add(BUSINESS_RULES.LOAN_PERIOD_DAYS, 'days').toDate();

const calculateOverdueFine = (dueDate) => {
  const today = moment();
  const due = moment(dueDate);
  if (today.isBefore(due)) return 0;
  const daysOverdue = today.diff(due, 'days');
  return daysOverdue * BUSINESS_RULES.OVERDUE_FINE_PER_DAY;
};

const isOverdue = (dueDate) => moment().isAfter(moment(dueDate));

const getDaysUntilDue = (dueDate) =>
  moment(dueDate).diff(moment(), 'days');

const isValidUUID = (id) => validateUUID(id);

const generateUUID = () => uuidv4();

const generateMembershipNumber = () =>
  `MEM-${uuidv4().substring(0, 8).toUpperCase()}`;

const formatDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');

const parsePaginationParams = (query) => {
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  let offset = parseInt(query.offset, 10) || PAGINATION.DEFAULT_OFFSET;

  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;
  if (offset < 0) offset = 0;

  return { limit, offset };
};

module.exports = {
  calculateDueDate,
  calculateOverdueFine,
  isOverdue,
  getDaysUntilDue,
  isValidUUID,
  generateUUID,
  generateMembershipNumber,
  formatDate,
  parsePaginationParams,
};
