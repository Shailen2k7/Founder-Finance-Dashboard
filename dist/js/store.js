/* ============================================
   Reactive State Store
   Simple pub/sub store for app-wide state
   ============================================ */

class Store {
  constructor() {
    this._state = {
      page: 'dashboard',
      entries: [],
      channels: [],
      settings: {},
      loading: true,
      supabaseConnected: false,
      filters: {
        business: 'all',
        type: 'all',
        account: 'all',
        category: 'all',
        year: 'all',
        month: 'all',
        search: '',
        dateFrom: '',
        dateTo: ''
      }
    };
    this._listeners = new Map();
    this._globalListeners = [];
  }

  get state() {
    return this._state;
  }

  // Get a specific piece of state
  get(key) {
    return this._state[key];
  }

  // Set state (shallow merge)
  set(updates) {
    const prev = { ...this._state };
    Object.assign(this._state, updates);

    // Notify specific listeners
    for (const key of Object.keys(updates)) {
      const listeners = this._listeners.get(key);
      if (listeners) {
        for (const fn of listeners) fn(this._state[key], prev[key]);
      }
    }

    // Notify global listeners
    for (const fn of this._globalListeners) {
      fn(this._state, prev);
    }
  }

  // Subscribe to changes on a specific key
  on(key, fn) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(fn);
    return () => this._listeners.get(key)?.delete(fn);
  }

  // Subscribe to all changes
  onAny(fn) {
    this._globalListeners.push(fn);
    return () => {
      this._globalListeners = this._globalListeners.filter(f => f !== fn);
    };
  }

  // --- Computed getters ---

  get filteredEntries() {
    const { entries, filters } = this._state;
    return entries.filter(e => {
      if (filters.business !== 'all' && e.business !== filters.business) return false;
      if (filters.type !== 'all' && e.type !== filters.type) return false;
      if (filters.account !== 'all' && e.account !== filters.account) return false;
      if (filters.category !== 'all' && e.category !== filters.category) return false;
      if (filters.year !== 'all') {
        const y = e.date?.split('-')[0];
        if (y !== filters.year) return false;
      }
      if (filters.month !== 'all') {
        const m = e.date?.split('-')[1];
        if (m !== filters.month) return false;
      }
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = `${e.description} ${e.category} ${e.business} ${e.account}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }

  get totalIncome() {
    return this._state.entries
      .filter(e => e.type === 'Income')
      .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  }

  get totalExpense() {
    return this._state.entries
      .filter(e => e.type === 'Expense')
      .reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0);
  }

  get netCashFlow() {
    return this.totalIncome - this.totalExpense;
  }

  get businesses() {
    return [...new Set(this._state.entries.map(e => e.business).filter(Boolean))].sort();
  }

  get accounts() {
    return [...new Set(this._state.entries.map(e => e.account).filter(Boolean))].sort();
  }

  get categories() {
    return [...new Set(this._state.entries.map(e => e.category).filter(Boolean))].sort();
  }

  get years() {
    return [...new Set(this._state.entries.map(e => e.date?.split('-')[0]).filter(Boolean))].sort();
  }

  get monthlyData() {
    const byMonth = {};
    for (const e of this._state.entries) {
      if (!e.date) continue;
      const key = e.date.substring(0, 7); // YYYY-MM
      if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
      if (e.type === 'Income') byMonth[key].income += parseFloat(e.amount) || 0;
      else byMonth[key].expense += Math.abs(parseFloat(e.amount) || 0);
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
        net: data.income - data.expense
      }));
  }

  get categoryBreakdown() {
    const cats = {};
    for (const e of this._state.entries) {
      if (e.type !== 'Expense' || !e.category) continue;
      const amt = Math.abs(parseFloat(e.amount) || 0);
      cats[e.category] = (cats[e.category] || 0) + amt;
    }
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount }));
  }

  get accountBreakdown() {
    const accs = {};
    for (const e of this._state.entries) {
      if (!e.account) continue;
      if (!accs[e.account]) accs[e.account] = { income: 0, expense: 0 };
      if (e.type === 'Income') accs[e.account].income += parseFloat(e.amount) || 0;
      else accs[e.account].expense += Math.abs(parseFloat(e.amount) || 0);
    }
    return Object.entries(accs).map(([account, data]) => ({
      account,
      ...data,
      net: data.income - data.expense
    }));
  }
}

export const store = new Store();
