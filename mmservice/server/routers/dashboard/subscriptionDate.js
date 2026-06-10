function formatDateOnly(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (!s) return null;
  return s.slice(0, 10);
}

function isNotExpired(expireDate) {
  const formatted = formatDateOnly(expireDate);
  if (!formatted) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = formatted.split('-').map(Number);
  const exp = new Date(y, m - 1, d);
  if (Number.isNaN(exp.getTime())) return false;
  return exp >= today;
}

module.exports = {
  formatDateOnly,
  isNotExpired,
};
