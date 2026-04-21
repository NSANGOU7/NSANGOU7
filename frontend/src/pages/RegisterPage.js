import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions générales');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      toast.success('Compte créé avec succès');
      navigate('/');
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4" data-testid="register-page">
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
            <p className="text-slate-500 mt-2">Créer un nouveau compte</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                required
                data-testid="register-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                data-testid="register-email"
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
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 ${
                          level <= strength
                            ? strength <= 1
                              ? 'bg-red-500'
                              : strength <= 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {strength <= 1 && 'Faible'}
                    {strength === 2 && 'Moyen'}
                    {strength >= 3 && 'Fort'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="register-confirm-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5"
                data-testid="register-terms"
              />
              <span className="text-sm text-slate-600">
                J'accepte les{' '}
                <Link to="/cgv" className="text-[#FF3333] hover:underline">
                  conditions générales de vente
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="text-[#FF3333] hover:underline">
                  politique de confidentialité
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0F1C] hover:bg-[#1F2937] text-white py-6 font-semibold"
              data-testid="register-submit"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#FF3333] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
