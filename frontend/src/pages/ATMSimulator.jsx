import React, { useState, useContext, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card, CardBody, Button, useToast, ToastContainer, Loading, PageTransition } from '../components';
import { accountAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ATMSimulator = () => {
  const { user } = useContext(AuthContext);
  const { toasts, addToast, removeToast } = useToast();
  const [screen, setScreen] = useState('welcome');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await accountAPI.getByCustomer(user?.customerId);
      setAccounts(res.data.data);
    } catch (error) { addToast('Failed to load accounts', 'error'); }
    finally { setInitialLoading(false); }
  }, [addToast, user?.customerId]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#8b5cf6', '#14b8a6'] });
  };

  const handleWithdraw = async (withdrawAmount) => {
    if (withdrawAmount > selectedAccount.balance) { addToast('Insufficient balance', 'error'); return; }
    try {
      setLoading(true);
      await accountAPI.withdraw(selectedAccount._id, { amount: withdrawAmount });
      setAmount(withdrawAmount);
      setScreen('success');
      fireConfetti();
      const res = await accountAPI.getByCustomer(user?.customerId);
      setAccounts(res.data.data);
      setTimeout(() => { setScreen('welcome'); setSelectedAccount(null); }, 3500);
    } catch (error) {
      addToast(error.response?.data?.message || 'Withdrawal failed', 'error');
      setScreen('menu');
    } finally { setLoading(false); }
  };

  if (initialLoading) return <Loading fullscreen message="Loading ATM..." />;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            {screen === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', bounce: 0.3 }}
              >
                <Card className="overflow-hidden">
                  {/* ATM Header */}
                  <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-slate-700/30 text-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl mb-3"
                    >🏧</motion.div>
                    <h1 className="text-2xl font-display font-bold text-slate-100">FinBank ATM</h1>
                    <p className="text-slate-400 text-sm mt-1">Select your account to continue</p>
                  </div>
                  <CardBody className="space-y-3 p-6">
                    {accounts.length === 0 ? (
                      <p className="text-red-400 text-center py-4">No accounts available</p>
                    ) : (
                      accounts.map((account, i) => (
                        <motion.button
                          key={account._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedAccount(account); setScreen('menu'); }}
                          className="w-full p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/30 text-left transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-200 capitalize">{account.accountType} Account</p>
                              <p className="text-xs text-slate-500 font-mono">{account.accountNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-100">₹{account.balance.toLocaleString()}</p>
                              <p className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Select →</p>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {screen === 'menu' && selectedAccount && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', bounce: 0.2 }}
              >
                <Card>
                  {/* Balance Display */}
                  <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 p-6 border-b border-slate-700/30">
                    <p className="text-sm text-slate-400 mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-slate-100">₹{selectedAccount.balance.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{selectedAccount.accountNumber}</p>
                  </div>
                  <CardBody className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-slate-100 text-center">Quick Withdraw</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[1000, 2000, 5000, 10000].map(value => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleWithdraw(value)}
                          disabled={loading || value > selectedAccount.balance}
                          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 text-center transition-all disabled:opacity-40"
                        >
                          <p className="text-xl font-bold text-slate-100">₹{value.toLocaleString()}</p>
                        </motion.button>
                      ))}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/30" /></div>
                      <div className="relative flex justify-center"><span className="px-3 text-xs text-slate-500 bg-slate-900">OR ENTER AMOUNT</span></div>
                    </div>

                    <input
                      type="number"
                      placeholder="Enter custom amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-input w-full px-4 py-4 text-center text-xl font-bold"
                    />
                    <Button
                      variant="success"
                      fullWidth
                      size="lg"
                      loading={loading}
                      onClick={() => handleWithdraw(parseFloat(amount))}
                    >
                      WITHDRAW
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => { setScreen('welcome'); setSelectedAccount(null); setAmount(''); }}
                    >
                      CANCEL
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {screen === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', bounce: 0.4 }}
              >
                <Card glow>
                  <CardBody className="text-center py-12 px-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="checkmark-circle mx-auto mb-6"
                    >
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        />
                      </svg>
                    </motion.div>
                    <h1 className="text-2xl font-display font-bold text-emerald-400 mb-2">Transaction Successful</h1>
                    <p className="text-4xl font-bold text-gradient mb-4">₹{parseFloat(amount).toLocaleString()}</p>
                    <p className="text-slate-400 text-sm mb-2">Your cash has been dispensed.</p>
                    <p className="text-slate-500 text-xs">Please collect your cash and card.</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-slate-600 text-xs mt-4"
                    >Redirecting in a moment...</motion.p>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default ATMSimulator;
