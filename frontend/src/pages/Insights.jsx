import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardBody, StatCard, Loading, useToast, ToastContainer, PageTransition, FadeIn, StaggerContainer, StaggerItem, CurrencyCounter } from '../components';
import { accountAPI, transactionAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import VirtualCard from '../components/VirtualCard';
import { FiTrendingUp, FiTrendingDown, FiTarget, FiPieChart, FiActivity, FiCreditCard } from 'react-icons/fi';

const Insights = () => {
  const { user } = useContext(AuthContext);
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedAccount) loadAnalytics();
  }, [selectedAccount]); // eslint-disable-line

  const loadData = async () => {
    try {
      setLoading(true);
      const accRes = await accountAPI.getByCustomer(user?.customerId);
      setAccounts(accRes.data.data);
      if (accRes.data.data.length > 0) {
        const accId = accRes.data.data[0]._id;
        setSelectedAccount(accId);
        const [transRes, analyticsRes] = await Promise.all([
          transactionAPI.getHistory(accId, { limit: 50 }),
          transactionAPI.getAnalytics(accId, 30).catch(() => ({ data: { data: null } }))
        ]);
        setTransactions(transRes.data.data);
        setAnalytics(analyticsRes.data.data);
      }
    } catch (error) {
      addToast('Failed to load insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [transRes, analyticsRes] = await Promise.all([
        transactionAPI.getHistory(selectedAccount, { limit: 50 }),
        transactionAPI.getAnalytics(selectedAccount, 30).catch(() => ({ data: { data: null } }))
      ]);
      setTransactions(transRes.data.data);
      setAnalytics(analyticsRes.data.data);

      // Check for fraud patterns
      const alerts = [];
      const deposits = transactions.filter(t => t.type === 'deposit');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');
      
      if (deposits.length > 0) {
        const avgDeposit = deposits.reduce((s, t) => s + t.amount, 0) / deposits.length;
        const largeDeposits = deposits.filter(t => t.amount > avgDeposit * 3);
        if (largeDeposits.length > 0) {
          alerts.push({ type: 'warning', message: `${largeDeposits.length} unusually large deposit(s) detected`, icon: '💰' });
        }
      }

      if (withdrawals.length > 5) {
        const recent = withdrawals.filter(t => {
          const diff = Date.now() - new Date(t.createdAt).getTime();
          return diff < 30 * 60 * 1000; // 30 min
        });
        if (recent.length > 3) {
          alerts.push({ type: 'danger', message: 'High withdrawal frequency detected', icon: '⚠️' });
        }
      }

      // Spending analysis
      if (withdrawals.length > 0) {
        const totalWithdrawn = withdrawals.reduce((s, t) => s + t.amount, 0);
        alerts.push({ type: 'info', message: `Total spent: ₹${totalWithdrawn.toLocaleString()} this period`, icon: '📊' });
      }

      setFraudAlerts(alerts);
    } catch (error) {
      // silent
    }
  };

  // Generate spending insights
  const generateInsights = () => {
    const insights = [];
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal');
    const totalDeposits = deposits.reduce((s, t) => s + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalDeposits > 0 ? ((totalDeposits - totalWithdrawals) / totalDeposits * 100) : 0;

    if (savingsRate > 30) {
      insights.push({ title: 'Excellent Saver!', desc: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep it up!`, icon: '🌟', color: 'emerald' });
    } else if (savingsRate > 10) {
      insights.push({ title: 'Good Progress', desc: `Your savings rate is ${savingsRate.toFixed(0)}%. Try to increase it to 30%.`, icon: '📈', color: 'indigo' });
    } else if (savingsRate > 0) {
      insights.push({ title: 'Room for Improvement', desc: `Your savings rate is ${savingsRate.toFixed(0)}%. Consider reducing expenses.`, icon: '💡', color: 'amber' });
    } else {
      insights.push({ title: 'Spending Alert', desc: 'Your expenses exceed your income. Review your spending.', icon: '🚨', color: 'rose' });
    }

    if (withdrawals.length > 10) {
      insights.push({ title: 'Frequent Withdrawals', desc: `${withdrawals.length} withdrawals detected. Consider consolidating.`, icon: '🔄', color: 'amber' });
    }

    if (totalDeposits > 100000) {
      insights.push({ title: 'High Earner', desc: 'Your deposits place you in the top tier. Explore investment options.', icon: '💎', color: 'purple' });
    }

    return insights;
  };

  // Chart data
  const transactionTrend = analytics?.dailyBreakdown?.map(d => ({
    date: new Date(d._id).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    amount: d.total,
    count: d.count
  })) || transactions.slice(0, 10).reverse().map((t, i) => ({
    date: `Day ${i + 1}`,
    amount: t.amount,
    count: 1
  }));

  const spendingByType = [
    { name: 'Deposits', value: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0) },
    { name: 'Withdrawals', value: transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0) },
    { name: 'Transfers', value: transactions.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b'];
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const insights = generateInsights();

  if (loading) return <Loading fullscreen message="Analyzing your finances..." />;

  return (
    <PageTransition>
      <div className="page-container">
        <div className="page-content">
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          <FadeIn className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">
              <span className="text-gradient">AI</span> Spending Insights
            </h1>
            <p className="text-slate-400">Smart analysis of your financial activity</p>
          </FadeIn>

          {/* Fraud Alerts */}
          {fraudAlerts.length > 0 && (
            <FadeIn delay={0.1} className="mb-6">
              <div className="space-y-3">
                {fraudAlerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      alert.type === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                      alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-indigo-500/10 border-indigo-500/20'
                    }`}
                  >
                    <span className="text-xl">{alert.icon}</span>
                    <p className={`text-sm font-medium ${
                      alert.type === 'danger' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-amber-400' :
                      'text-indigo-400'
                    }`}>{alert.message}</p>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Stats */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StaggerItem>
              <StatCard icon={<FiCreditCard />} label="Total Balance" value={<CurrencyCounter amount={totalBalance} />} color="indigo" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={<FiTrendingUp />} label="Total Deposits" value={<CurrencyCounter amount={transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)} />} color="emerald" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={<FiTrendingDown />} label="Total Spent" value={<CurrencyCounter amount={transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)} />} color="rose" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={<FiActivity />} label="Transactions" value={transactions.length} color="purple" />
            </StaggerItem>
          </StaggerContainer>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader title="Transaction Trend" subtitle="Amount over time" icon={<FiTrendingUp />} gradient />
                <CardBody>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={transactionTrend}>
                        <defs>
                          <linearGradient id="insightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
                          formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#insightGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card>
                <CardHeader title="Transaction Breakdown" subtitle="By type" icon={<FiPieChart />} />
                <CardBody>
                  {spendingByType.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={spendingByType} innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                              {spendingByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
                              formatter={(v) => [`₹${v.toLocaleString()}`]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center mt-2">
                        {spendingByType.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                            <span className="text-xs text-slate-400">{d.name}: ₹{d.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-500">No data</div>
                  )}
                </CardBody>
              </Card>
            </FadeIn>
          </div>

          {/* AI Insights */}
          <FadeIn delay={0.4} className="mb-8">
            <Card>
              <CardHeader title="Smart Insights" subtitle="AI-powered financial analysis" icon={<FiTarget />} gradient />
              <CardBody>
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.map((insight, i) => (
                    <StaggerItem key={i}>
                      <div className={`p-5 rounded-xl bg-${insight.color}-500/5 border border-${insight.color}-500/10`}>
                        <div className="text-3xl mb-3">{insight.icon}</div>
                        <h4 className="font-bold text-slate-100 mb-1">{insight.title}</h4>
                        <p className="text-sm text-slate-400">{insight.desc}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </CardBody>
            </Card>
          </FadeIn>

          {/* Virtual Card Section */}
          <FadeIn delay={0.5}>
            <Card>
              <CardHeader title="Your Virtual Card" subtitle="Digital debit card" icon={<FiCreditCard />} />
              <CardBody>
                <div className="max-w-sm mx-auto">
                  <VirtualCard
                    cardHolder={`${user?.customer?.firstName?.toUpperCase() || 'USER'} ${user?.customer?.lastName?.toUpperCase() || ''}`}
                  />
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
};

export default Insights;
