import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardBody, StatCard, Button, Loading, useToast, ToastContainer, Modal, PageTransition, FadeIn, StaggerContainer, StaggerItem, CurrencyCounter } from '../components';
import { accountAPI, customerAPI, transactionAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import VirtualCard from '../components/VirtualCard';
import { FiPlus, FiArrowUpRight, FiArrowDownLeft, FiSend, FiTrendingUp, FiCreditCard, FiDollarSign, FiActivity } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics] = useState(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState('savings');
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, accountsRes] = await Promise.all([
        customerAPI.getProfile(),
        accountAPI.getAll()
      ]);

      setProfile(profileRes.data.data);
      setAccounts(accountsRes.data.data || []);

      if (accountsRes.data.data?.length > 0) {
        try {
          const transRes = await transactionAPI.getAll({ limit: 5 });
          setTransactions(transRes.data.data || []);
        } catch (err) {
          console.log('Transactions fetch error (non-critical):', err.message);
          setTransactions([]);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load dashboard';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setCreatingAccount(true);
      await accountAPI.create({ customerId: user?.customerId, accountType: newAccountType });
      addToast('Account created successfully', 'success');
      setShowNewAccount(false);
      loadDashboardData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to create account', 'error');
    } finally {
      setCreatingAccount(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Chart data
  const balanceData = analytics?.dailyBreakdown?.map(d => ({
    date: new Date(d._id).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    amount: d.total
  })) || [
    { date: 'Week 1', amount: totalBalance * 0.7 },
    { date: 'Week 2', amount: totalBalance * 0.8 },
    { date: 'Week 3', amount: totalBalance * 0.85 },
    { date: 'Week 4', amount: totalBalance },
  ];

  const accountTypeData = accounts.reduce((acc, account) => {
    const existing = acc.find(a => a.name === account.accountType);
    if (existing) existing.value += account.balance;
    else acc.push({ name: account.accountType, value: account.balance });
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b'];

  const txTypeIcon = (type) => {
    if (type === 'deposit') return <FiArrowDownLeft className="text-emerald-400" />;
    if (type === 'withdrawal') return <FiArrowUpRight className="text-red-400" />;
    return <FiSend className="text-indigo-400" />;
  };

  if (loading) return <Loading fullscreen message="Loading your dashboard..." />;

  return (
    <PageTransition>
      <div className="page-container">
        <div className="page-content">
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          {/* Header */}
          <FadeIn className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">
              Welcome back, <span className="text-gradient">{profile?.firstName}</span>
            </h1>
            <p className="text-slate-400">Here's your financial overview for today</p>
          </FadeIn>

          {/* Stat Cards */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StaggerItem>
              <StatCard
                icon={<FiDollarSign />}
                label="Total Balance"
                value={<CurrencyCounter amount={totalBalance} />}
                subValue={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
                color="indigo"
                delay={0}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={<FiTrendingUp />}
                label="Monthly Activity"
                value={transactions.length}
                subValue="transactions this month"
                color="emerald"
                delay={1}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={<FiCreditCard />}
                label="Active Accounts"
                value={accounts.filter(a => a.status === 'active').length}
                subValue={`of ${accounts.length} total`}
                color="purple"
                delay={2}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={<FiActivity />}
                label="Savings Goal"
                value={<CurrencyCounter amount={Math.min(totalBalance, 50000)} />}
                subValue={`of ₹50,000 (${Math.min(100, Math.round((totalBalance / 50000) * 100))}%)`}
                color="amber"
                delay={3}
              />
            </StaggerItem>
          </StaggerContainer>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Balance Chart */}
            <FadeIn className="lg:col-span-2" delay={0.2}>
              <Card>
                <CardHeader
                  title="Balance Trend"
                  subtitle="Last 30 days"
                  icon={<FiTrendingUp />}
                  gradient
                />
                <CardBody>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceData}>
                        <defs>
                          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '12px',
                            color: '#e2e8f0',
                            fontSize: '13px'
                          }}
                          formatter={(v) => [`₹${v.toLocaleString()}`, 'Balance']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#balanceGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </FadeIn>

            {/* Account Distribution */}
            <FadeIn delay={0.3}>
              <Card className="h-full">
                <CardHeader title="Accounts" subtitle="Balance distribution" icon={<FiCreditCard />} />
                <CardBody>
                  {accountTypeData.length > 0 ? (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={accountTypeData}
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {accountTypeData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '12px',
                                color: '#e2e8f0',
                                fontSize: '12px'
                              }}
                              formatter={(v) => [`₹${v.toLocaleString()}`]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-2">
                        {accountTypeData.map((item, i) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-sm text-slate-300 capitalize">{item.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-200">₹{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      No accounts yet
                    </div>
                  )}
                </CardBody>
              </Card>
            </FadeIn>
          </div>

          {/* Bottom Grid: Accounts + Virtual Card + Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accounts List */}
            <FadeIn delay={0.4}>
              <Card>
                <CardHeader
                  title="Your Accounts"
                  icon={<FiCreditCard />}
                  action={
                    <Button size="sm" onClick={() => setShowNewAccount(true)} icon={<FiPlus size={14} />}>
                      New
                    </Button>
                  }
                />
                <CardBody>
                  {accounts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No accounts yet</p>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map((account, i) => (
                        <motion.div
                          key={account._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="capitalize font-semibold text-slate-200 text-sm">{account.accountType}</span>
                            <span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                              {account.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mb-1">{account.accountNumber}</p>
                          <p className="text-xl font-bold text-slate-100">₹{account.balance.toLocaleString()}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </FadeIn>

            {/* Virtual Card */}
            <FadeIn delay={0.5}>
              <Card className="flex flex-col">
                <CardHeader title="Virtual Card" subtitle="Your digital card" icon={<FiCreditCard />} />
                <CardBody className="flex-1 flex items-center">
                  <div className="w-full">
                    <VirtualCard
                      cardHolder={`${profile?.firstName?.toUpperCase()} ${profile?.lastName?.toUpperCase()}`}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-800/30">
                        <p className="text-xs text-slate-500">Card Status</p>
                        <p className="text-sm font-semibold text-emerald-400">Active</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/30">
                        <p className="text-xs text-slate-500">Card Type</p>
                        <p className="text-sm font-semibold text-slate-200">Debit</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </FadeIn>

            {/* Recent Transactions */}
            <FadeIn delay={0.6}>
              <Card>
                <CardHeader
                  title="Recent Transactions"
                  icon={<FiActivity />}
                  action={<Link to="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View All →</Link>}
                />
                <CardBody>
                  {transactions.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No transactions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx, i) => (
                        <motion.div
                          key={tx._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between py-2.5 border-b border-slate-700/20 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800/50 flex items-center justify-center text-lg">
                              {txTypeIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200 capitalize">{tx.type}</p>
                              <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </FadeIn>
          </div>

          {/* Create Account Modal */}
          <Modal
            isOpen={showNewAccount}
            title="Create New Account"
            onClose={() => setShowNewAccount(false)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowNewAccount(false)}>Cancel</Button>
                <Button loading={creatingAccount} onClick={handleCreateAccount}>Create Account</Button>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="glass-input w-full px-4 py-3"
                >
                  <option value="savings" className="bg-slate-900">Savings Account</option>
                  <option value="current" className="bg-slate-900">Current Account</option>
                  <option value="fixed_deposit" className="bg-slate-900">Fixed Deposit</option>
                </select>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <h4 className="text-sm font-semibold text-indigo-300 mb-2">Account Features</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Free online banking & mobile app</li>
                  <li>• Zero minimum balance (Savings)</li>
                  <li>• Competitive interest rates</li>
                  <li>• Instant fund transfers</li>
                </ul>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
