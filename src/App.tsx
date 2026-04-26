import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  Search, 
  User, 
  History, 
  Package, 
  FileText, 
  LogOut, 
  Plus, 
  Check, 
  X,
  MapPin,
  Mail,
  Lock,
  Phone
} from 'lucide-react';
import { cn } from './lib/utils';
import type { User as UserType, BloodStock, BloodRequest, BloodGroup } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'admin' | 'auth'>('home');
  const [user, setUser] = useState<UserType | null>(null);
  const [inventory, setInventory] = useState<BloodStock[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLogin, setIsLogin] = useState(true);

  // Auth States
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    blood_group: 'O+' as BloodGroup,
    address: '',
    role: 'donor' as 'donor' | 'hospital'
  });

  useEffect(() => {
    fetchInventory();
    if (user?.role === 'admin' || user?.role === 'hospital') {
      fetchRequests();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const fetchRequests = async () => {
    const url = user?.role === 'donor' ? `/api/requests?userId=${user.id}` : '/api/requests';
    try {
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: authForm.email, password: authForm.password } : authForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setActiveTab(data.role === 'admin' ? 'admin' : 'dashboard');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Authentication failed');
    }
  };

  const handleRequestBlood = async (bloodGroup: BloodGroup, quantity: number) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: user.id,
          requester_name: user.name,
          blood_group_needed: bloodGroup,
          quantity_ml: quantity,
        }),
      });
      if (res.ok) {
        alert('Request submitted successfully!');
        fetchRequests();
      }
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchRequests();
        fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <Droplet className="text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">VitalFlow</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('home')}
              className={cn("text-sm font-medium transition-colors hover:text-red-600", activeTab === 'home' ? "text-red-600" : "text-slate-600")}
            >
              Search
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => setActiveTab(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className={cn("text-sm font-medium transition-colors hover:text-red-600", (activeTab === 'dashboard' || activeTab === 'admin') ? "text-red-600" : "text-slate-600")}
                >
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </button>
                <button 
                  onClick={() => { setUser(null); setActiveTab('home'); }}
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-red-600"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-all active:scale-95 shadow-md shadow-red-100"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="text-center space-y-6 max-w-3xl mx-auto py-12">
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                  Save Lives with <span className="text-red-600">Every Drop.</span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Join the VitalFlow network today. Whether you're a donor looking to help or a medical professional in urgent need, we bridge the gap in real-time.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setActiveTab('auth')}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Become a Donor
                  </button>
                  <button 
                    onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Search Blood
                  </button>
                </div>
              </div>

              {/* Stats / Inventory Preview */}
              <div id="search-section" className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Real-time Availability</h2>
                    <p className="text-slate-500">Current blood stock levels across all centers.</p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search blood group..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {inventory.map((item) => (
                    <div 
                      key={item.blood_group}
                      className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center hover:bg-white hover:shadow-lg hover:border-red-100 transition-all duration-300 cursor-pointer"
                      onClick={() => handleRequestBlood(item.blood_group, 500)}
                    >
                      <div className="text-2xl font-black text-slate-800 mb-1 group-hover:text-red-600 transition-colors">{item.blood_group}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.quantity_ml}ml</div>
                      <div className={cn(
                        "mt-3 h-1.5 w-full rounded-full overflow-hidden bg-slate-200",
                        item.quantity_ml < 2000 ? "bg-red-100" : "bg-emerald-100"
                      )}>
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            item.quantity_ml < 2000 ? "bg-red-500" : "bg-emerald-500"
                          )} 
                          style={{ width: `${Math.min(100, (item.quantity_ml / 5000) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Join VitalFlow'}</h2>
                  <p className="text-slate-500 mt-2">{isLogin ? 'Access your donor dashboard' : 'Register to help and receive help'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                          value={authForm.name}
                          onChange={e => setAuthForm({...authForm, name: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                        value={authForm.email}
                        onChange={e => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="password" 
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                        value={authForm.password}
                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Blood Group</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                            value={authForm.blood_group}
                            onChange={e => setAuthForm({...authForm, blood_group: e.target.value as BloodGroup})}
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Role</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                            value={authForm.role}
                            onChange={e => setAuthForm({...authForm, role: e.target.value as any})}
                          >
                            <option value="donor">Donor</option>
                            <option value="hospital">Hospital</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">City / Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            required
                            type="text" 
                            placeholder="New York, NY"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                            value={authForm.address}
                            onChange={e => setAuthForm({...authForm, address: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-[0.98] mt-4 shadow-lg shadow-red-100"
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'dashboard' || activeTab === 'admin') && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
                  <p className="text-slate-500">
                    {user.role === 'admin' ? 'System Administrator Dashboard' : 
                     user.role === 'hospital' ? 'Hospital Management Portal' : 'Donor History & Eligibility'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Droplet className="text-red-500" size={16} />
                    {user.blood_group}
                  </div>
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin className="text-slate-400" size={16} />
                    {user.address}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Quick Actions */}
                <div className="space-y-8">
                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/10 rounded-2xl">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-[10px] uppercase font-black text-slate-400">Total Units</div>
                      </div>
                      <div className="p-4 bg-emerald-500 rounded-2xl text-white">
                        <div className="text-2xl font-bold">Safe</div>
                        <div className="text-[10px] uppercase font-black text-emerald-100">Eligibility</div>
                      </div>
                    </div>
                  </div>

                  {user.role === 'hospital' && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Plus className="text-red-500" size={20} />
                        New Blood Request
                      </h3>
                      <div className="space-y-4">
                        <select id="req-group" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        <input id="req-qty" type="number" placeholder="Quantity (ml)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                        <button 
                          onClick={() => {
                            const group = (document.getElementById('req-group') as HTMLSelectElement).value as BloodGroup;
                            const qty = parseInt((document.getElementById('req-qty') as HTMLInputElement).value);
                            handleRequestBlood(group, qty);
                          }}
                          className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                        >
                          Submit Request
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Package className="text-red-500" size={20} />
                      Inventory Levels
                    </h3>
                    <div className="space-y-3">
                      {inventory.slice(0, 4).map(item => (
                        <div key={item.blood_group} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                          <span className="font-bold text-slate-700">{item.blood_group}</span>
                          <span className="text-sm font-mono text-slate-500">{item.quantity_ml}ml</span>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab('home')} className="w-full text-center text-xs font-bold text-red-600 hover:underline pt-2">View Full Inventory</button>
                    </div>
                  </div>
                </div>

                {/* Right Column: List of Requests/History */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-red-500" size={22} />
                        {user.role === 'admin' ? 'Pending Approvals' : 'Transaction History'}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {requests.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                          <p>No recent activity found.</p>
                        </div>
                      ) : (
                        requests.map(req => (
                          <div key={req.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-bold text-slate-800 border border-slate-100">
                                {req.blood_group_needed}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{req.requester_name}</div>
                                <div className="text-sm text-slate-500 flex items-center gap-3">
                                  <span>{req.quantity_ml}ml needed</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              {user.role === 'admin' && req.status === 'pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateStatus(req.id, 'approved')}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600"
                                  >
                                    <Check size={16} /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200"
                                  >
                                    <X size={16} /> Reject
                                  </button>
                                </>
                              ) : (
                                <div className={cn(
                                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                                  req.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                  req.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                  "bg-red-100 text-red-700"
                                )}>
                                  {req.status}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Droplet className="text-red-600" size={24} />
              <span className="text-xl font-bold tracking-tight text-slate-800">VitalFlow</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Advancing healthcare through technology. Connecting those who can help with those in need, safely and securely.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-red-600">Blood Search</button></li>
              <li><button onClick={() => setActiveTab('home')} className="hover:text-red-600">Donation Centers</button></li>
              <li><button onClick={() => setActiveTab('auth')} className="hover:text-red-600">Admin Login</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Contact Support</h4>
            <div className="space-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                support@vitalflow.org
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                +1 (800) VITAL-BLOOD
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

