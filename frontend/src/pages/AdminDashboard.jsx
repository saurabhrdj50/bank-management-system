import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardBody, StatCard, Button, Loading, useToast, ToastContainer, Modal, PageTransition, FadeIn, StaggerContainer, StaggerItem, CurrencyCounter } from '../components';
import { adminAPI, loanAPI } from '../services/api';
import { FiUsers, FiCreditCard, FiDollarSign, FiTrendingUp, FiActivity, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

const AdminDashboard = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loanFilter, setLoanFilter] = useState('pending');
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadDashboardData(); }, []); // eslint-disable-line
  useEffect(() => { if (activeTab === 'loans') loadLoans(); }, [activeTab, loanFilter]); // eslint-disable-line

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, transRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllTransactions({ page: 1, limit: 10 })
      ]);
      setStats(statsRes.data.data);
      setTransactions(transRes.data.data);
    } catch (error) {
      addToast('Failed to load dashboard', 'error');
    } finally { setLoading(false); }
  };

  const loadLoans = async () => {
    try {
      const res = await loanAPI.getAll(1, 10, loanFilter);
      setLoans(res.data.data);
    } catch (error) { addToast('Failed to load loans', 'error'); }
  };

  const handleApproveLoan = async (loanId) => {
    try {
      setProcessing(true);
      await loanAPI.approve(loanId);
      addToast('Loan approved', 'success');
      loadLoans();
    } catch (error) { addToast('Failed to approve', 'error'); }
    finally { setProcessing(false); }
  };

  const handleRejectLoan = async () => {
    if (!rejectReason.trim()) { addToast('Enter rejection reason', 'error'); return; }
    try {
      setProcessing(true);
      await loanAPI.reject(selectedLoan._id, { reason: rejectReason });
      addToast('Loan rejected', 'success');
      setShowRejectModal(false);
      setRejectReason('');
      loadLoans();
    } catch (error) { addToast('Failed to reject', 'error'); }
    finally { setProcessing(false); }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

  if (loading) return <Loading fullscreen message="Loading admin dashboard..." />;

  const loanStatusData = [
    { name: 'Approved', value: stats?.summary?.approvedLoans || 0 },
    { name: 'Pending', value: stats?.summary?.pendingLoans || 0 },
    { name: 'Rejected', value: stats?.summary?.rejectedLoans || 0 },
    { name: 'Disbursed', value: stats?.summary?.disbursedLoans || 0 },
  ].filter(d => d.value > 0);

  const transactionData = [
    { name: 'Deposits', value: stats?.summary?.totalDeposits || 0 },
    { name: 'Withdrawals', value: stats?.summary?.totalWithdrawals || 0 },
  ];

  return (
    <PageTransition>
      <div className="page-container">
        <div className="page-content">
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          <FadeIn className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Admin Dashboard</h1>
            <p className="text-slate-400">System overview and management tools</p>
          </FadeIn>

          {/* Tab Navigation */}
          <FadeIn delay={0.1} className="mb-6">
            <div className="flex gap-2 p-1 rounded-xl bg-slate-800/30 border border-slate-700/30 w-fit">
              {['overview', 'loans', 'transactions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && stats && (
            <>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StaggerItem>
                  <StatCard icon={<FiUsers />} label="Total Users" value={stats.summary?.totalUsers} subValue={`${stats.summary?.activeUsers} active`} color="indigo" />
                </StaggerItem>
                <StaggerItem>
                  <StatCard icon={<FiCreditCard />} label="Total Accounts" value={stats.summary?.totalAccounts} subValue={`${stats.summary?.activeAccounts} active`} color="emerald" />
                </StaggerItem>
                <StaggerItem>
                  <StatCard icon={<FiDollarSign />} label="Total Balance" value={<CurrencyCounter amount={stats.financials?.totalBalance || 0} />} color="purple" />
                </StaggerItem>
                <StaggerItem>
                  <StatCard icon={<FiAlertTriangle />} label="Pending Loans" value={stats.summary?.pendingLoans || 0} color="amber" />
                </StaggerItem>
              </StaggerContainer>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <FadeIn delay={0.2}>
                  <Card>
                    <CardHeader title="Loan Distribution" icon={<FiTrendingUp />} />
                    <CardBody>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={loanStatusData} innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                              {loanStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center mt-2">
                        {loanStatusData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                            <span className="text-xs text-slate-400">{d.name}: {d.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <Card>
                    <CardHeader title="Transaction Overview" icon={<FiActivity />} />
                    <CardBody>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={transactionData} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                            <YAxis stroke="#475569" fontSize={12} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardBody>
                  </Card>
                </FadeIn>
              </div>

              {/* Quick Stats & Top Customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FadeIn delay={0.4}>
                  <Card>
                    <CardHeader title="Financial Summary" icon={<FiDollarSign />} />
                    <CardBody>
                      <div className="space-y-3">
                        {[
                          { label: 'Total Transaction Volume', value: `₹${((stats.financials?.totalTransactionAmount || 0) / 100000).toFixed(1)}L` },
                          { label: 'Average Transaction', value: `₹${Math.round(stats.financials?.avgTransactionAmount || 0).toLocaleString()}` },
                          { label: 'Total Loans Disbursed', value: `₹${((stats.financials?.totalLoansDisbursed || 0) / 100000).toFixed(1)}L` },
                          { label: 'Total Loans Outstanding', value: `₹${((stats.financials?.totalLoansOutstanding || 0) / 100000).toFixed(1)}L` },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-700/20 last:border-0">
                            <span className="text-sm text-slate-400">{item.label}</span>
                            <span className="text-sm font-bold text-slate-200">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </FadeIn>

                <FadeIn delay={0.5}>
                  <Card>
                    <CardHeader title="Top Customers" icon="⭐" />
                    <CardBody>
                      {stats.recentActivity?.topCustomers?.length > 0 ? (
                        <div className="space-y-3">
                          {stats.recentActivity.topCustomers.map((customer, i) => (
                            <div key={customer._id} className="flex items-center justify-between py-2.5 border-b border-slate-700/20 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  #{i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-200">{customer.firstName} {customer.lastName}</p>
                                  <p className="text-xs text-slate-500">{customer.email}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-slate-200">₹{customer.totalBalance?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">No data</p>
                      )}
                    </CardBody>
                  </Card>
                </FadeIn>
              </div>
            </>
          )}

          {/* LOANS TAB */}
          {activeTab === 'loans' && (
            <>
              <FadeIn delay={0.1} className="mb-6">
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'approved', 'rejected'].map(s => (
                    <button
                      key={s}
                      onClick={() => setLoanFilter(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                        loanFilter === s
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800/30 text-slate-400 border border-slate-700/30'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </FadeIn>

              <StaggerContainer className="space-y-4">
                {loans.map(loan => (
                  <StaggerItem key={loan._id}>
                    <Card>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-100">
                              {loan.customerId?.firstName} {loan.customerId?.lastName}
                            </h3>
                            <span className={`badge ${
                              loan.status === 'approved' ? 'badge-success' :
                              loan.status === 'pending' ? 'badge-warning' : 'badge-danger'
                            }`}>{loan.status}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-slate-500">Amount:</span> <span className="font-semibold text-slate-200">₹{loan.principalAmount?.toLocaleString()}</span></div>
                            <div><span className="text-slate-500">Type:</span> <span className="font-semibold text-slate-200 capitalize">{loan.loanType}</span></div>
                            <div><span className="text-slate-500">Rate:</span> <span className="font-semibold text-slate-200">{loan.interestRate}%</span></div>
                            <div><span className="text-slate-500">EMI:</span> <span className="font-semibold text-slate-200">₹{loan.monthlyEMI?.toLocaleString()}</span></div>
                          </div>
                        </div>
                        {loan.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" loading={processing} onClick={() => handleApproveLoan(loan._id)} icon={<FiCheckCircle />}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => { setSelectedLoan(loan); setShowRejectModal(true); }} icon={<FiXCircle />}>Reject</Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
                {loans.length === 0 && (
                  <Card>
                    <CardBody className="text-center py-12">
                      <p className="text-slate-500">No {loanFilter} loans found</p>
                    </CardBody>
                  </Card>
                )}
              </StaggerContainer>
            </>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <FadeIn>
              <Card>
                <CardHeader title="Recent Transactions" icon={<FiActivity />} />
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="table-premium">
                      <thead>
                        <tr>
                          <th>Date</th><th>Type</th><th>Amount</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx._id}>
                            <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="capitalize">{tx.type}</td>
                            <td className="font-semibold">₹{tx.amount?.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${tx.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </FadeIn>
          )}

          {/* Reject Modal */}
          <Modal
            isOpen={showRejectModal}
            title="Reject Loan Application"
            onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button variant="danger" loading={processing} onClick={handleRejectLoan}>Reject</Button>
              </>
            }
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Rejection</label>
              <textarea
                placeholder="Enter reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="glass-input w-full px-4 py-3 resize-none"
              />
            </div>
          </Modal>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
