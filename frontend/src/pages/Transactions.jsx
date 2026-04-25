import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardBody, Button, Loading, useToast, ToastContainer, Modal, Input, SuccessModal, PageTransition, FadeIn } from '../components';
import { accountAPI, transactionAPI } from '../services/api';
import { FiArrowDownLeft, FiArrowUpRight, FiSend, FiDownload, FiFilter, FiRefreshCw, FiCreditCard } from 'react-icons/fi';

const Transactions = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState('deposit');
  const [successAmount, setSuccessAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferData, setTransferData] = useState({ toAccountId: '', amount: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadAccounts(); }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedAccount) loadTransactions();
  }, [selectedAccount, filterType, page]); // eslint-disable-line

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getAll();
      setAccounts(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedAccount(res.data.data[0]._id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      addToast('Failed to load accounts', 'error');
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const params = { page, limit: 10 };
      if (filterType) params.type = filterType;
      const res = selectedAccount 
        ? await transactionAPI.getHistory(selectedAccount, params)
        : await transactionAPI.getAll(params);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      addToast('Failed to load transactions', 'error');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount <= 0) { addToast('Enter a valid amount', 'error'); return; }
    try {
      setProcessing(true);
      await accountAPI.deposit(selectedAccount, { amount: parseFloat(depositAmount) });
      setShowDepositModal(false);
      setSuccessType('deposit');
      setSuccessAmount(depositAmount);
      setDepositAmount('');
      setShowSuccess(true);
      loadTransactions();
      loadAccounts();
    } catch (error) {
      addToast(error.response?.data?.message || 'Deposit failed', 'error');
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) { addToast('Enter a valid amount', 'error'); return; }
    try {
      setProcessing(true);
      await accountAPI.withdraw(selectedAccount, { amount: parseFloat(withdrawAmount) });
      setShowWithdrawModal(false);
      setSuccessType('withdraw');
      setSuccessAmount(withdrawAmount);
      setWithdrawAmount('');
      setShowSuccess(true);
      loadTransactions();
      loadAccounts();
    } catch (error) {
      addToast(error.response?.data?.message || 'Withdrawal failed', 'error');
    } finally { setProcessing(false); }
  };

  const handleTransfer = async () => {
    if (!transferData.toAccountId || !transferData.amount || transferData.amount <= 0) { addToast('Enter valid details', 'error'); return; }
    try {
      setProcessing(true);
      await accountAPI.transfer({ fromAccountId: selectedAccount, toAccountId: transferData.toAccountId, amount: parseFloat(transferData.amount) });
      setShowTransferModal(false);
      setSuccessType('transfer');
      setSuccessAmount(transferData.amount);
      setTransferData({ toAccountId: '', amount: '' });
      setShowSuccess(true);
      loadTransactions();
      loadAccounts();
    } catch (error) {
      addToast(error.response?.data?.message || 'Transfer failed', 'error');
    } finally { setProcessing(false); }
  };

  const txTypeConfig = {
    deposit: { icon: <FiArrowDownLeft size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    withdrawal: { icon: <FiArrowUpRight size={18} />, color: 'text-red-400', bg: 'bg-red-500/10' },
    transfer: { icon: <FiSend size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    interest_credit: { icon: <FiArrowDownLeft size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  };

  if (loading) return <Loading fullscreen message="Loading transactions..." />;

  return (
    <PageTransition>
      <div className="page-container">
        <div className="page-content">
          <ToastContainer toasts={toasts} removeToast={removeToast} />

          <FadeIn className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Transactions</h1>
            <p className="text-slate-400">Manage your money with ease</p>
          </FadeIn>

          {/* Account Selection */}
          <FadeIn delay={0.1} className="mb-6">
            <Card>
              <CardHeader title="Select Account" icon={<FiCreditCard />} />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account, i) => (
                    <motion.div
                      key={account._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => { setSelectedAccount(account._id); setPage(1); }}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedAccount === account._id
                          ? 'bg-indigo-500/10 border-2 border-indigo-500/40 shadow-neon'
                          : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-semibold text-slate-200">{account.accountType}</span>
                        <span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {account.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-2">{account.accountNumber}</p>
                      <p className="text-2xl font-bold text-slate-100">₹{account.balance.toLocaleString()}</p>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </FadeIn>

          {/* Quick Actions */}
          <FadeIn delay={0.2} className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Deposit', icon: <FiArrowDownLeft />, color: 'from-emerald-600 to-emerald-500', shadow: 'shadow-emerald-500/20', action: () => setShowDepositModal(true) },
                { label: 'Withdraw', icon: <FiArrowUpRight />, color: 'from-red-600 to-red-500', shadow: 'shadow-red-500/20', action: () => setShowWithdrawModal(true) },
                { label: 'Transfer', icon: <FiSend />, color: 'from-indigo-600 to-indigo-500', shadow: 'shadow-indigo-500/20', action: () => setShowTransferModal(true) },
                { label: 'Export', icon: <FiDownload />, color: 'from-slate-700 to-slate-600', shadow: 'shadow-slate-500/10', action: () => addToast('Export feature coming soon', 'info') },
              ].map((btn, i) => (
                <motion.button
                  key={btn.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={btn.action}
                  className={`p-4 rounded-xl bg-gradient-to-br ${btn.color} text-white font-semibold flex flex-col items-center gap-2 shadow-lg ${btn.shadow} hover:shadow-xl transition-shadow`}
                >
                  <span className="text-2xl">{btn.icon}</span>
                  <span className="text-sm">{btn.label}</span>
                </motion.button>
              ))}
            </div>
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={0.3} className="mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FiFilter size={14} />
                <span>Filter:</span>
              </div>
              {['', 'deposit', 'withdrawal', 'transfer'].map(type => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterType === type
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  {type || 'All'}
                </button>
              ))}
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={loadTransactions}
                className="p-2 rounded-xl bg-slate-800/30 text-slate-400 hover:text-slate-200 border border-slate-700/30 ml-auto"
              >
                <FiRefreshCw size={16} />
              </motion.button>
            </div>
          </FadeIn>

          {/* Transactions Table */}
          <FadeIn delay={0.4}>
            <Card>
              <CardHeader title="Transaction History" subtitle={`${transactions.length} transactions`} />
              <CardBody>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">No transactions found</p>
                    <p className="text-slate-600 text-sm mt-1">Make your first transaction to see it here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-premium">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th className="text-right">Amount</th>
                          <th className="text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, i) => {
                          const config = txTypeConfig[tx.type] || txTypeConfig.deposit;
                          return (
                            <motion.tr
                              key={tx._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="group"
                            >
                              <td className="text-slate-300">
                                {new Date(tx.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center ${config.color}`}>
                                    {config.icon}
                                  </div>
                                  <span className="capitalize text-slate-200 font-medium">{tx.type}</span>
                                </div>
                              </td>
                              <td className="text-slate-400">{tx.description || 'N/A'}</td>
                              <td className={`text-right font-semibold ${
                                tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                              </td>
                              <td className="text-right">
                                <span className={`badge ${
                                  tx.status === 'completed' ? 'badge-success' :
                                  tx.status === 'pending' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </FadeIn>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
              <span className="text-sm text-slate-400 px-4">Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}

          {/* Deposit Modal */}
          <Modal
            isOpen={showDepositModal}
            title="Deposit Money"
            onClose={() => setShowDepositModal(false)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowDepositModal(false)}>Cancel</Button>
                <Button loading={processing} onClick={handleDeposit} icon="💰">Confirm Deposit</Button>
              </>
            }
          >
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000, 25000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt.toString())}
                  className="flex-1 py-2 rounded-lg bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </Modal>

          {/* Withdraw Modal */}
          <Modal
            isOpen={showWithdrawModal}
            title="Withdraw Money"
            onClose={() => setShowWithdrawModal(false)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
                <Button loading={processing} onClick={handleWithdraw} variant="danger">Confirm Withdrawal</Button>
              </>
            }
          >
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount to withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setWithdrawAmount(amt.toString())}
                  className="flex-1 py-2 rounded-lg bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </Modal>

          {/* Transfer Modal */}
          <Modal
            isOpen={showTransferModal}
            title="Transfer Money"
            onClose={() => setShowTransferModal(false)}
            footer={
              <>
                <Button variant="ghost" onClick={() => setShowTransferModal(false)}>Cancel</Button>
                <Button loading={processing} onClick={handleTransfer} icon="📤">Confirm Transfer</Button>
              </>
            }
          >
            <Input
              label="Recipient Account ID"
              placeholder="Enter account ID"
              value={transferData.toAccountId}
              onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
              required
            />
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              required
            />
          </Modal>

          {/* Success Modal */}
          <SuccessModal
            isOpen={showSuccess}
            onClose={() => setShowSuccess(false)}
            amount={successAmount}
            type={successType}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default Transactions;
