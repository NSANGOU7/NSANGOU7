import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Une erreur s'est produite. Veuillez réessayer.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion réussie');
      navigate(redirect);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link to="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft size={18} />
          Retour à l'accueil
        </Link>

        {/* Card */}
        <div className="bg-white border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">AUTO<span className="text-[#FF3333]">PARTS</span></h1>
            <p className="text-slate-500 mt-2">Connectez-vous à votre compte</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                data-testid="login-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-slate-600">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="text-[#FF3333] hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0F1C] hover:bg-[#1F2937] text-white py-6 font-semibold"
              data-testid="login-submit"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-[#FF3333] font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
