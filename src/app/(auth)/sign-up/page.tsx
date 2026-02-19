'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordError =
    password.length > 0 && password.length < 8
      ? 'Password must be at least 8 characters'
      : '';

  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? 'Passwords do not match'
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name,
        action: 'signup',
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin'
            ? 'Could not create account. Email may already be in use.'
            : result.error
        );
      } else {
        router.push('/onboarding/welcome');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 shadow-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] bg-clip-text text-transparent">
            Aureum
          </h1>
          <p className="text-[#8892B0] mt-2 text-sm">
            Create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6"
          >
            <p className="text-red-400 text-sm text-center">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl pl-11 pr-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl pl-11 pr-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className={`w-full bg-[#1B1E36] border rounded-xl pl-11 pr-4 py-3 text-white placeholder-[#4A5568] focus:outline-none transition-colors ${
                  passwordError
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-[rgba(255,255,255,0.06)] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]'
                }`}
              />
            </div>
            {passwordError && (
              <p className="text-red-400 text-xs mt-1.5">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your password"
                className={`w-full bg-[#1B1E36] border rounded-xl pl-11 pr-4 py-3 text-white placeholder-[#4A5568] focus:outline-none transition-colors ${
                  confirmError
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-[rgba(255,255,255,0.06)] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]'
                }`}
              />
            </div>
            {confirmError && (
              <p className="text-red-400 text-xs mt-1.5">{confirmError}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!passwordError || !!confirmError}
            className="w-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[#8892B0] text-sm mt-6">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="text-[#9B59F5] hover:text-[#B07AF5] font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
