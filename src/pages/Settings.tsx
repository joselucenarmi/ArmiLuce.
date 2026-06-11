import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Shield, Save, Loader2, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const { profile, user, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await updateProfile({ full_name: fullName });
    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Ajustes</h1>
        <p className="text-slate-400 mt-1">Gestiona tu cuenta y configuración</p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <User size={20} />
            Información del perfil
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/30 border border-slate-700/50 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">El email no puede modificarse</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {showSuccess && <span className="text-emerald-400 text-sm">Guardado correctamente</span>}
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-red-500/20">
          <h2 className="text-lg font-medium text-red-400 flex items-center gap-2">
            <Shield size={20} />
            Zona de peligro
          </h2>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-sm">Al cerrar sesión, se borrarán tus datos locales.</p>
          <button
            onClick={async () => {
              if (confirm('¿Cerrar sesión?')) {
                await signOut();
              }
            }}
            className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
