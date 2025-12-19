const moment = require('moment');

class DateUtils {
  static getCurrentDate() {
    return moment().utc().toDate();
  }

  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
  }

  static calculateDueDate(borrowedDate, days = 14) {
    return moment(borrowedDate).add(days, 'days').toDate();
  }

  static calculateOverdueDays(dueDate, returnDate = new Date()) {
    const due = moment(dueDate);
    const returned = moment(returnDate);
    
    if (returned.isAfter(due)) {
      return returned.diff(due, 'days');
    }
    return 0;
  }

  static calculateFine(overdueDays, rate = 0.5) {
    return overdueDays * rate;
  }

  static isDateInPast(date) {
    return moment(date).isBefore(moment());
  }

  static isDateInFuture(date) {
    return moment(date).isAfter(moment());
  }

  static getStartOfDay(date) {
    return moment(date).startOf('day').toDate();
  }

  static getEndOfDay(date) {
    return moment(date).endOf('day').toDate();
  }
}

module.exports = DateUtils;