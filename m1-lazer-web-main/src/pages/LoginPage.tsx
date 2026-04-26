import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 bg-gradient-to-br from-[#0f0f14] via-[#14141a] to-[#1a1a22]"
    >
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255,0,102,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(139,125,222,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <LoginForm />
    </div>
  );
};

export default LoginPage;
