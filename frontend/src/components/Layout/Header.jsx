import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { LogOut, Bell, User, Clock, X, CheckCircle, UserPlus } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers.js';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  // Загрузка уведомлений
  const loadNotifications = async () => {
    try {
      console.log('🔄 Loading notifications...');
      const response = await notificationsAPI.getNotifications();
      console.log('📨 Notifications response:', response);
      console.log('📋 Notifications data:', response.data);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadUnreadCount = async () => {
    try {
      console.log('🔄 Loading unread count...');
      const response = await notificationsAPI.getUnreadCount();
      console.log('🔢 Unread count:', response.data.count);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  // Отметить уведомление как прочитанное
  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Отметить все как прочитанные
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.is_read);
      for (const notif of unreadNotifications) {
        await notificationsAPI.markAsRead(notif.id);
      }
      
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      loadNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.data && notification.data.card_id && notification.data.project_id) {
      navigate(`/projects/${notification.data.project_id}`, { 
        state: { 
          openCardId: notification.data.card_id,
          fromNotification: true 
        }
      });
    }
    setShowNotifications(false);
  };

  // Получить иконку для типа уведомления
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'card_assignment':
        return <UserPlus size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  // Получить цвет фона для типа уведомления
  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'card_assignment':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Форматирование времени уведомления с поддержкой перевода
  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInMinutes < 1) {
      return t('notifications.justNow');
    } else if (diffInMinutes < 60) {
      return t('notifications.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInHours < 24) {
      return t('notifications.hoursAgo', { hours: diffInHours });
    } else {
      // Для дат используем существующую функцию formatDate
      return formatDate(dateString);
    }
  };

  // Простая функция для множественных чисел в русском языке
  const pluralize = (number, one, few, many) => {
    if (number % 10 === 1 && number % 100 !== 11) {
      return one;
    } else if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) {
      return few;
    } else {
      return many;
    }
  };

  // Улучшенная функция форматирования времени для русского языка
  const formatNotificationTimeRu = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInMinutes < 1) {
      return 'только что';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${pluralize(diffInMinutes, 'минуту', 'минуты', 'минут')} назад`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${pluralize(diffInHours, 'час', 'часа', 'часов')} назад`;
    } else {
      return formatDate(dateString);
    }
  };

  // Финальная функция форматирования времени
  const getFormattedTime = (dateString) => {
    // Можно использовать текущий язык из контекста, но для простоты используем функцию
    return formatNotificationTimeRu(dateString);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">{t('header.jiraAnalog')}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Уведомления */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors relative"
              onClick={handleBellClick}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown уведомлений */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">{t('header.notifications')}</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {t('header.markAllAsRead')}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell size={24} className="mx-auto mb-2 text-gray-400" />
                      <p>{t('header.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            getNotificationBgColor(notification.type)
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-gray-500">
                                {getFormattedTime(notification.created_at)}
                              </p>
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <CheckCircle size={12} />
                                  <span>{t('header.markAsRead')}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Профиль пользователя */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* Выход */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title={t('header.logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;