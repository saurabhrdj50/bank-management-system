import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Loading, useToast, ToastContainer, Modal, Input, Select, PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components';
import { loanAPI, accountAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FiDollarSign, FiPercent, FiClock, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Loans = () => {
  const { user } = useContext(AuthContext);
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    principalAmount: '', tenure: 12, loanType: 'personal', accountId: ''
  });

  const loanTypes = [
    { value: 'personal', label: 'Personal Loan' },
    { value: 'home', label: 'Home Loan' },
    { value: 'auto', label: 'Auto Loan' },
    { value: 'business', label: 'Business Loan' }
  ];

  const rates = { personal: 8.5, home: 6.5, auto: 7.5, business: 9.5 };

  useEffect(() => { loadLoans(); loadAccounts(); }, []); // eslint-disable-line
  useEffect(() => { loadLoans(); }, [filterStatus]); // eslint-disable-line

  const loadLoans = async () => {
    try {
      const res = await loanAPI.getByCustomer(user?.customerId, filterStatus);
      setLoans(res.data.data);
      setLoading(false);
    } catch (error) {
      addToast('Failed to load loans', 'error');
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getByCustomer(user?.customerId);
      setAccounts(res.data.data);
      if (res.data.data.length > 0) setFormData(p => ({ ...p, accountId: res.data.data[0]._id }));
    } catch (error) { /* silent */ }
  };

  const calculateEMI = (principal, rate, tenure) => {
    if (!principal || !rate || !tenure) return 0;
    const r = rate / 12 / 100;
    return Math.round((principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));
  };

  const handleApplyLoan = async () => {
    if (!formData.principalAmount || formData.principalAmount <= 0) { addToast('Enter valid amount', 'error'); return; }
    try {
      setApplying(true);
      await loanAPI.apply({ customerId: user?.customerId, ...formData });
      addToast('Loan application submitted!', 'success');
      setShowApplyModal(false);
      setFormData({ principalAmount: '', tenure: 12, loanType: 'personal', accountId: accounts[0]?._id });
      loadLoans();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  const emiAmount = calculateEMI(parseFloat(formData.principalAmount) || 0, rates[formData.loanType], parseInt(formData.tenure) || 12);
  const totalAmount = emiAmount * (parseInt(formData.tenure) || 12);

  const statusConfig = {
    pending: { color: 'badge-warning', icon: <FiClock /> },
    approved: { color: 'badge-success', icon: <FiCheckCircle /> },
    disbursed: { color: 'badge-info', icon: <FiTrendingUp /> },
    closed: { color: 'badge-neutral', icon: <FiCheckCircle /> },
    rejected: { color: 'badge-danger', icon: <FiXCircle /> },
  };

  const loanTypeIcons = { personal: '👤', home: '🏠', auto: '🚗', business: '💼' };

  if (loading) return <Loading fullscreen message="Loading loans..." />;

  return (
    <PageTransition>
      <div className="page-container">
        <div className="page-content">
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          <FadeIn className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Loans</h1>
                <p className="text-slate-400">Apply and manage your loan applications</p>
              </div>
              <Button onClick={() => setShowApplyModal(true)} size="lg" icon={<FiDollarSign />}>
                Apply for Loan
              </Button>
            </div>
          </FadeIn>

          {/* Filter */}
          <FadeIn delay={0.1} className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {['', 'pending', 'approved', 'disbursed', 'closed', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    filterStatus === s
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  {s || 'All Loans'}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Loans Grid */}
          {loans.length === 0 ? (
            <FadeIn>
              <Card>
                <CardBody className="text-center py-16">
                  <div className="text-5xl mb-4">💰</div>
                  <p className="text-slate-400 text-lg">No loans found</p>
                  <p className="text-slate-500 text-sm mt-1">Apply for a loan to get started</p>
                </CardBody>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loans.map(loan => {
                const config = statusConfig[loan.status] || statusConfig.pending;
                const paidPercent = loan.totalAmount ? Math.round((loan.amountPaid / loan.totalAmount) * 100) : 0;
                return (
                  <StaggerItem key={loan._id}>
                    <Card>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">
                            {loanTypeIcons[loan.loanType] || '💰'}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-100 capitalize">{loan.loanType} Loan</h3>
                            <span className={`badge ${config.color}`}>
                              {loan.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-100">₹{loan.principalAmount?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Principal</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                        {[
                          { icon: <FiPercent />, label: 'Interest', value: `${loan.interestRate}% p.a.` },
                          { icon: <FiClock />, label: 'Tenure', value: `${loan.tenure} months` },
                          { icon: <FiDollarSign />, label: 'Monthly EMI', value: `₹${loan.monthlyEMI?.toLocaleString()}` },
                          { icon: <FiTrendingUp />, label: 'Total', value: `₹${loan.totalAmount?.toLocaleString()}` },
                        ].map(item => (
                          <div key={item.label} className="p-3 rounded-xl bg-slate-800/30">
                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                              {item.icon}
                              <span className="text-xs">{item.label}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-200">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                          <span>Paid: ₹{loan.amountPaid?.toLocaleString()}</span>
                          <span>{paidPercent}%</span>
                        </div>
                        <div className="progress-premium">
                          <motion.div
                            className="progress-premium-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${paidPercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        Applied: {new Date(loan.applicationDate).toLocaleDateString()}
                        {loan.approvalDate && ` • Approved: ${new Date(loan.approvalDate).toLocaleDateString()}`}
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}

          {/* Apply Loan Modal */}
          <Modal
            isOpen={showApplyModal}
            title="Apply for a Loan"
            size="lg"
            onClose={() => setShowApplyModal(false)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button loading={applying} onClick={handleApplyLoan}>Submit Application</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Select
                label="Loan Type"
                options={loanTypes}
                value={formData.loanType}
                onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                required
              />
              <Input
                label="Loan Amount (₹)"
                type="number"
                placeholder="Enter amount"
                value={formData.principalAmount}
                onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tenure: {formData.tenure} months ({(formData.tenure / 12).toFixed(1)} years)
                </label>
                <input
                  type="range" min="1" max="60"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 month</span><span>60 months</span>
                </div>
              </div>

              {/* EMI Preview */}
              <motion.div
                layout
                className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/15"
              >
                <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <FiTrendingUp className="text-indigo-400" /> Loan Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Rate</span>
                    <span className="font-semibold text-slate-200">{rates[formData.loanType]}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly EMI</span>
                    <span className="font-bold text-xl text-gradient">₹{emiAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-700/30 pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Total Amount</span>
                    <span className="font-bold text-slate-100">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>

              {accounts.length > 0 && (
                <Select
                  label="Disburse To Account"
                  options={accounts.map(a => ({ value: a._id, label: `${a.accountType} - ${a.accountNumber}` }))}
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                />
              )}
            </div>
          </Modal>
        </div>
      </div>
    </PageTransition>
  );
};

export default Loans;
