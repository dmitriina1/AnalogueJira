import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { invitationsAPI } from '../../services/api';
import { Eye, EyeOff, Users, Shield, ExternalLink } from 'lucide-react';

const InvitePage = () => {
  const { token } = useParams();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();
  
  const [invitation, setInvitation] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');
  const [accessType, setAccessType] = useState('');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await invitationsAPI.getInvitationByToken(token);
      const invitationData = response.data;
      setInvitation(invitationData);
      
      if (invitationData.role === 'viewer') {
        await loadProjectForViewing(token);
      }
    } catch (err) {
      setError(t('invite.invalidInvitation'));
    } finally {
      setLoading(false);
    }
  };

  const loadProjectForViewing = async (token) => {
    try {
      const response = await invitationsAPI.viewProjectByToken(token);
      setProject(response.data.project);
      setAccessType('view_only');
    } catch (err) {
      setError(t('invite.failedToLoad'));
    }
  };

  const handleViewAsGuest = () => {
    if (project) {
      navigate(`/projects/${project.id}?view_mode=guest&token=${token}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(loginForm.username, loginForm.password);
      await invitationsAPI.acceptInvitation(token);
      navigate(`/projects/${invitation.project_id}`);
    } catch (err) {
      setError(t('invite.loginFailed'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError(t('invite.passwordsNotMatch'));
      return;
    }

    try {
      const response = await invitationsAPI.registerAndAcceptInvitation(token, {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password
      });
      
      navigate(`/projects/${invitation.project_id}`);
    } catch (err) {
      setError(t('invite.registrationFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link to="/login" className="btn btn-primary">
            {t('common.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  if (invitation.role === 'viewer' && project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('invite.projectViewAccess')}
            </h2>
            <div className="mt-4 bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {project.description}
              </p>
              <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users size={16} />
                  <span>{t('invite.viewOnlyAccess')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={16} />
                  <span>{t('invite.noRegistrationRequired')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleViewAsGuest}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <ExternalLink size={16} />
              <span>{t('invite.viewProjectAsGuest')}</span>
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{t('invite.orJoinAsMember')}</p>
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {t('invite.signInToJoin')}
              </button>
              <span className="mx-2 text-gray-400">|</span>
              <button
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {t('invite.signUpToJoin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('invite.projectInvitation')}
          </h2>
          <div className="mt-4 bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {invitation.project_name}
            </h3>
            <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>{t('invite.invitedBy')} {invitation.invited_by?.username}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield size={16} />
                <span>{t('invite.role')} {t(`roles.${invitation.role}`)}</span>
              </div>
            </div>
          </div>
        </div>

        {user ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              {t('invite.welcomeAccept', { username: user.username })}
            </p>
            <button
              onClick={async () => {
                try {
                  await invitationsAPI.acceptInvitation(token);
                  navigate(`/projects/${invitation.project_id}`);
                } catch (err) {
                  setError(t('invite.loginFailed'));
                }
              }}
              className="btn btn-primary w-full"
            >
              {t('invite.acceptInvitation')}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex border-b mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 font-medium ${
                  mode === 'login'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500'
                }`}
              >
                {t('invite.signIn')}
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 font-medium ${
                  mode === 'register'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500'
                }`}
              >
                {t('invite.signUp')}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    {t('auth.username')}
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.username')}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('auth.password')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('auth.password')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  {t('invite.signInJoin')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700">
                    {t('auth.username')}
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.chooseUsername')}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('auth.email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.enterEmail')}
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                    {t('auth.password')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('auth.createPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('auth.confirmPassword')}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  {t('invite.signUpJoin')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;