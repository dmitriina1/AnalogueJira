import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { projectsAPI, boardsAPI, cardsAPI, commentsAPI, labelsAPI, checklistsAPI, usersAPI, invitationsAPI, notificationsAPI } from '../../services/api';
import { Plus, Users, MessageSquare, Clock, GripVertical, X, CheckSquare, Tag, Trash2, ChevronDown, MoreHorizontal, Filter } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// Компонент фильтра по участникам
const AssigneeFilter = ({ members, selectedAssignees, onFilterChange, onClearFilter }) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleAssigneeToggle = (userId) => {
    const newSelected = selectedAssignees.includes(userId)
      ? selectedAssignees.filter(id => id !== userId)
      : [...selectedAssignees, userId];
    onFilterChange(newSelected);
  };

  const handleShowAll = () => {
    onFilterChange([]);
    setIsOpen(false);
  };

  const handleShowUnassigned = () => {
    onFilterChange(['unassigned']);
    setIsOpen(false);
  };

  const getFilterLabel = () => {
    if (selectedAssignees.length === 0) return t('filter.showAll');
    if (selectedAssignees.includes('unassigned')) return t('filter.unassignedOnly');
    
    const selectedCount = selectedAssignees.length;
    if (selectedCount === 1) {
      const member = members.find(m => m.user.id === selectedAssignees[0]);
      return member ? member.user.username : t('filter.selectedUsers');
    }
    return t('filter.selectedUsersCount', { count: selectedCount });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        <Filter size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getFilterLabel()}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20 dark:bg-gray-800 dark:border-gray-600">
          <div className="p-3 border-b dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('filter.filterByAssignees')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('filter.filterDescription')}</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {/* Быстрые фильтры */}
            <div className="p-2 border-b dark:border-gray-600">
              <button
                onClick={handleShowAll}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedAssignees.length === 0 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('filter.showAll')}
              </button>
              <button
                onClick={handleShowUnassigned}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedAssignees.includes('unassigned') 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('filter.unassignedOnly')}
              </button>
            </div>

            {/* Список участников */}
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 dark:text-gray-400">
                {t('filter.selectUsers')}
              </h4>
              {members.map(member => (
                <label key={member.user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(member.user.id)}
                    onChange={() => handleAssigneeToggle(member.user.id)}
                    className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {member.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{member.user.username}</span>
                  </div>
                  {member.role === 'admin' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                      {t('roles.admin')}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {selectedAssignees.length > 0 && (
            <div className="p-3 border-t dark:border-gray-600">
              <button
                onClick={onClearFilter}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('filter.clearFilter')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// SortableCard компонент
const SortableCard = ({ card, onClick, isGuestMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Получаем прогресс первого чеклиста
  const checklistProgress = card.checklists && card.checklists.length > 0
    ? card.checklists[0]
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm border p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={() => onClick(card)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Card Labels */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex space-x-1 mb-2">
              {card.labels.map(label => (
                <span
                  key={label.id}
                  className="w-12 h-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {card.title}
          </h4>

          {/* Card Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              {/* Checklist Progress */}
              {checklistProgress && (
                <div className="flex items-center space-x-1">
                  <CheckSquare size={14} />
                  <span>{checklistProgress.completed_count || 0}/{checklistProgress.total_count || 0}</span>
                </div>
              )}

              {/* Due Date */}
              {card.due_date && (
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{new Date(card.due_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* Comments Count */}
              {card.comments && card.comments.length > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare size={14} />
                  <span>{card.comments.length}</span>
                </div>
              )}
            </div>

            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex -space-x-1">
                {card.assignees.map(assignee => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800"
                    title={assignee.username}
                  >
                    {assignee.username?.[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drag Handle - скрываем в guest режиме */}
        {!isGuestMode && (
          <div
            {...attributes}
            {...listeners}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab dark:text-gray-500 dark:hover:text-gray-400"
          >
            <GripVertical size={16} />
          </div>
        )}
      </div>
    </div>
  );
};

// SortableList компонент
const SortableList = ({ list, onAddCard, onCardClick, onDeleteList, currentUserRole, isGuestMode, filterAssignees }) => {
  const t = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [showMenu, setShowMenu] = useState(false);

  // Функция для проверки, должна ли карточка отображаться
  const shouldShowCard = (card) => {
    if (!filterAssignees || filterAssignees.length === 0) return true;
    
    // Фильтр "без исполнителей"
    if (filterAssignees.includes('unassigned')) {
      return !card.assignees || card.assignees.length === 0;
    }
    
    // Фильтр по конкретным пользователям
    if (!card.assignees || card.assignees.length === 0) return false;
    
    return card.assignees.some(assignee => 
      filterAssignees.includes(assignee.id)
    );
  };

  const filteredCards = list.cards ? list.cards.filter(shouldShowCard) : [];
  const hiddenCardsCount = list.cards ? list.cards.length - filteredCards.length : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4 dark:bg-gray-800"
    >
      <div className="flex justify-between items-center mb-4">
        <div
          className="flex items-center space-x-2"
          {...(!isGuestMode ? { ...attributes, ...listeners } : {})}
          style={{ cursor: isGuestMode ? 'default' : 'grab' }}
        >
          {!isGuestMode && <GripVertical size={16} className="text-gray-400" />}
          <h3 className="font-semibold text-gray-900 dark:text-white">{list.name}</h3>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
              {filteredCards.length}
            </span>
            {hiddenCardsCount > 0 && (
              <span className="text-xs text-gray-400 mt-1">
                {t('filter.hiddenCount', { count: hiddenCardsCount })}
              </span>
            )}
          </div>

          {/* Menu Button - только для ADMIN и не в guest режиме */}
          {!isGuestMode && currentUserRole === 'admin' && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-700"
              >
                <MoreHorizontal size={16} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10 dark:bg-gray-800 dark:border-gray-600">
                  <button
                    onClick={() => {
                      onDeleteList(list.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm dark:hover:bg-red-900"
                  >
                    <Trash2 size={16} />
                    <span>{t('common.delete')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SortableContext items={filteredCards.map(card => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px]">
          {filteredCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onClick={onCardClick}
              isGuestMode={isGuestMode}
            />
          ))}
          
          {filteredCards.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm dark:text-gray-400">
              {t('filter.noCardsInList')}
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add Card Button - только для ADMIN и MEMBER и не в guest режиме */}
      {!isGuestMode && (currentUserRole === 'admin' || currentUserRole === 'member') && (
        <button
          onClick={() => onAddCard(list)}
          className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>{t('board.addCard')}</span>
        </button>
      )}
    </div>
  );
};

// Компонент для отображения карточки в DragOverlay
const CardPreview = ({ card }) => {
  if (!card) return null;

  // Получаем прогресс первого чеклиста
  const checklistProgress = card.checklists && card.checklists.length > 0
    ? card.checklists[0]
    : null;

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 w-80 transform rotate-3 dark:bg-gray-800 dark:border-gray-700">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
        {card.title}
      </h4>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          {/* Checklist Progress */}
          {checklistProgress && (
            <div className="flex items-center space-x-1">
              <CheckSquare size={14} />
              <span>{checklistProgress.completed_count || 0}/{checklistProgress.total_count || 0}</span>
            </div>
          )}

          {/* Due Date */}
          {card.due_date && (
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{new Date(card.due_date).toLocaleDateString()}</span>
            </div>
          )}

          {/* Comments Count */}
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare size={14} />
              <span>{card.comments.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {card.assignees.map(assignee => (
              <div
                key={assignee.id}
                className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800"
                title={assignee.username}
              >
                {assignee.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для отображения участников команды
const TeamMembersDropdown = ({ members }) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Показываем только первых 5 участников в превью
  const displayMembers = members.slice(0, 5);
  const hasMoreMembers = members.length > 5;

  return (
    <div className="relative">
      {/* Кнопка с аватарками */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
      >
        <div className="flex -space-x-2">
          {displayMembers.map(member => (
            <div
              key={member.id}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white dark:border-gray-800"
              title={member.user.username}
            >
              {member.user.username[0].toUpperCase()}
            </div>
          ))}
          {hasMoreMembers && (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs border-2 border-white dark:bg-gray-600 dark:text-gray-300">
              +{members.length - 5}
            </div>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-10 dark:bg-gray-800 dark:border-gray-600">
          <div className="p-3 border-b dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('project.teamMembers')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{members.length} {t('project.members')}</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">{member.user.username}</p>
                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{t(`roles.${member.role}`)}</p>
                  </div>
                </div>
                {member.role === 'admin' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                    {t('roles.admin')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectDetail = () => {
  const t = useTranslation();
  const { projectId } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();

  const { state } = location;
  const openCardIdFromState = state?.openCardId;
  const fromNotification = state?.fromNotification;

  // Проверяем guest-режим из query параметров
  const queryParams = new URLSearchParams(location.search);
  const isGuestMode = queryParams.get('view_mode') === 'guest';
  const guestToken = queryParams.get('token');

  // Основные состояния
  const [project, setProject] = useState(null);
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(isGuestMode ? 'viewer' : null);

  // Состояния для карточек и модальных окон
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);

  // Новые состояния для управления списками
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('member');
  const [generatedInvite, setGeneratedInvite] = useState(null);

  // Состояния для формы создания карточки
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    due_date: ''
  });

  // Состояния для комментариев
  const [commentText, setCommentText] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Состояния для Drag & Drop
  const [activeId, setActiveId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  // Состояния для редактирования карточки
  const [editingCardData, setEditingCardData] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [projectLabels, setProjectLabels] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3B82F6' });
  const [newChecklist, setNewChecklist] = useState({ title: '' });
  const [newChecklistItems, setNewChecklistItems] = useState({});

  // Состояния для фильтрации
  const [filterAssignees, setFilterAssignees] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Предопределенные цвета
  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Функция для поиска пользователей
  const searchUsers = async (query) => {
    if (!project?.id) {
      setMentionSuggestions([]);
      return;
    }

    try {
      const response = await usersAPI.searchProjectUsers(project.id, query);
      setMentionSuggestions(response.data);
      setShowMentions(true);
      setMentionIndex(0);
    } catch (error) {
      console.error('Error searching users:', error);
      setMentionSuggestions([]);
    }
  };

  // Обработчик изменения текста комментария
  const handleCommentChange = (text) => {
    setCommentText(text);

    // Проверяем упоминания
    const lastAtSymbol = text.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const query = text.slice(lastAtSymbol + 1);
      const beforeAt = text.slice(0, lastAtSymbol);
      
      // Проверяем, что @ не в середине слова и нет пробела после @
      const isAtStartOfWord = lastAtSymbol === 0 || text[lastAtSymbol - 1] === ' ';
      const hasSpaceAfterAt = query.includes(' ');
      
      if (isAtStartOfWord && !hasSpaceAfterAt) {
        // Ищем пользователей даже при пустом запросе (просто @)
        searchUsers(query);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Функция для выбора пользователя
  const handleSelectMention = (user) => {
    const lastAtSymbol = commentText.lastIndexOf('@');
    const beforeAt = commentText.slice(0, lastAtSymbol);
    const newText = `${beforeAt}@${user.username} `;
    
    setCommentText(newText);
    setShowMentions(false);
  };

  // Функция для отображения комментариев с подсветкой упоминаний
  const renderCommentWithMentions = (text, mentions = []) => {
    if (!text) return null;
    
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Текст до упоминания
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Само упоминание
      const username = match[1];
      const mentionedUser = mentions.find(m => m.username === username);
      
      if (mentionedUser) {
        parts.push(
          <span 
            key={match.index}
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 rounded font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            title={`Упомянут пользователь: ${mentionedUser.username}`}
          >
            @{username}
          </span>
        );
      } else {
        parts.push(`@${username}`);
      }

      lastIndex = match.index + match[0].length;
    }

    // Остаток текста после последнего упоминания
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Обработка клавиш для навигации по упоминаниям
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showMentions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex(prev => prev < mentionSuggestions.length - 1 ? prev + 1 : prev);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Escape') {
          setShowMentions(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMentions, mentionSuggestions]);

  // Закрытие списка упоминаний при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMentions && !event.target.closest('.mention-container')) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentions]);

  // Обработка открытия карточки из уведомления
  useEffect(() => {
    const openCardFromNotification = async () => {
      if (openCardIdFromState && fromNotification) {
        console.log('🔔 Opening card from notification:', openCardIdFromState);
        
        // Если доска еще не загружена, ждем ее загрузки
        if (!board) {
          console.log('📋 Board not loaded yet, waiting...');
          return;
        }

        // Ищем карточку во всех списках доски
        let targetCard = null;
        
        for (const list of board.lists) {
          const foundCard = list.cards?.find(card => card.id === openCardIdFromState);
          if (foundCard) {
            targetCard = foundCard;
            break;
          }
        }

        if (targetCard) {
          console.log('✅ Card found in board, opening modal...');
          
          // Загружаем полные данные карточки
          try {
            const cardResponse = await cardsAPI.getCard(openCardIdFromState);
            const fullCardData = cardResponse.data;
            
            setSelectedCard(fullCardData);
            setShowCardModal(false); // Закрываем модалку создания карточки если открыта
            
            // Очищаем состояние после использования
            window.history.replaceState({}, document.title);
            console.log('✅ Card modal opened successfully');
          } catch (error) {
            console.error('❌ Error loading card details:', error);
            // Если не удалось загрузить детали, используем базовые данные
            setSelectedCard(targetCard);
            window.history.replaceState({}, document.title);
          }
        } else {
          console.log('❌ Card not found in current board, trying direct API call...');
          // Пробуем загрузить карточку напрямую через API
          try {
            const cardResponse = await cardsAPI.getCard(openCardIdFromState);
            const fullCardData = cardResponse.data;
            setSelectedCard(fullCardData);
            setShowCardModal(false);
            window.history.replaceState({}, document.title);
            console.log('✅ Card loaded via direct API call');
          } catch (error) {
            console.error('❌ Card not found via API:', error);
            // Очищаем состояние даже если карточка не найдена
            window.history.replaceState({}, document.title);
          }
        }
      }
    };

    openCardFromNotification();
  }, [openCardIdFromState, fromNotification, board]);

  // Обработка уведомления при загрузке доски
  useEffect(() => {
    if (openCardIdFromState && fromNotification && !board && project) {
      console.log('🔄 Notification received but board not loaded, loading board...');
      loadBoardData();
    }
  }, [openCardIdFromState, fromNotification, board, project]);

  const loadBoardData = async () => {
    if (!project?.boards?.[0]?.id) return;
    
    try {
      const boardId = project.boards[0].id;
      const boardRes = await boardsAPI.getBoard(boardId);
      setBoard(boardRes.data);
      console.log('✅ Board loaded for notification');
    } catch (error) {
      console.error('❌ Error loading board:', error);
    }
  };

  // Загрузка данных проекта
  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  // Находим активную карточку для DragOverlay
  useEffect(() => {
    if (activeId && board) {
      for (const list of board.lists) {
        const card = list.cards?.find(card => card.id === activeId);
        if (card) {
          setActiveCard(card);
          return;
        }
      }
    }
    setActiveCard(null);
  }, [activeId, board]);

  // Загрузка данных для редактирования карточки
  useEffect(() => {
    if (selectedCard && project) {
      loadCardEditData();
    }
  }, [selectedCard, project]);

  const loadProjectData = async () => {
    try {
      console.log('🔄 Loading project data...');
      
      if (isGuestMode) {
        // В guest режиме используем специальный endpoint
        const projectRes = await invitationsAPI.viewProjectByToken(guestToken);
        setProject(projectRes.data.project);
        setBoard(projectRes.data.board);
        // В guest режиме участники не загружаются или загружаются без viewer
        setMembers([]);
      } else {
        const [projectRes, membersRes] = await Promise.all([
          projectsAPI.getProject(projectId),
          projectsAPI.getProjectMembers(projectId)
        ]);

        setProject(projectRes.data);
        setMembers(membersRes.data);

        // Определяем роль текущего пользователя в проекте
        const currentMember = membersRes.data.find(member =>
          member.user.id === currentUser.id
        );
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }

        // Загружаем доску проекта
        if (projectRes.data.boards && projectRes.data.boards.length > 0) {
          const boardId = projectRes.data.boards[0].id;
          const boardRes = await boardsAPI.getBoard(boardId);
          setBoard(boardRes.data);
        }
      }

      console.log('✅ Project data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функции для фильтрации
  const handleFilterChange = (selectedUserIds) => {
    setFilterAssignees(selectedUserIds);
  };

  const handleClearFilter = () => {
    setFilterAssignees([]);
  };

  // Функция для проверки роли при создании карточки
  const handleAddCardClick = (list) => {
    if (isGuestMode || currentUserRole === 'viewer') {
      // alert(t('project.guestViewWarning'));
      return;
    }
    setSelectedList(list);
    setShowCardModal(true);
  };

  const handleCreateInvitation = async () => {
    try {
      const response = await invitationsAPI.createInvitation(projectId, {
        role: inviteRole
      });
      setGeneratedInvite(response.data);
    } catch (error) {
      console.error('Error creating invitation:', error);
      // alert(t('projects.failedToCreate'));
    }
  };

  // Улучшенная функция refreshCardData
  const refreshCardData = async () => {
    if (!selectedCard) return;

    try {
      const cardResponse = await cardsAPI.getCard(selectedCard.id);
      const updatedCard = cardResponse.data;

      setSelectedCard(updatedCard);

      setEditingCardData({
        title: updatedCard.title,
        description: updatedCard.description || '',
        due_date: updatedCard.due_date ? updatedCard.due_date.split('T')[0] : ''
      });

      return updatedCard;
    } catch (error) {
      console.error('Error refreshing card data:', error);
      throw error;
    }
  };

  const loadCardEditData = async () => {
    if (!selectedCard || !project) return;

    try {
      setEditingCardData({
        title: selectedCard.title,
        description: selectedCard.description || '',
        due_date: selectedCard.due_date ? selectedCard.due_date.split('T')[0] : ''
      });

      // В guest режиме не загружаем данные для редактирования
      if (!isGuestMode) {
        const [labelsRes, membersRes] = await Promise.all([
          labelsAPI.getProjectLabels(project.id),
          usersAPI.getUsers()
        ]);

        setProjectLabels(labelsRes.data);
        setAvailableMembers(membersRes.data);
      }
    } catch (error) {
      console.error('Error loading card edit data:', error);
    }
  };

  // Создание нового списка
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim() || !board) return;

    try {
      // Создаем новый список
      const listResponse = await boardsAPI.createList(board.id, {
        name: newListName,
        position: board.lists ? board.lists.length : 0
      });

      // Обновляем доску с новым списком
      const boardRes = await boardsAPI.getBoard(board.id);
      setBoard(boardRes.data);

      // Сбрасываем форму и закрываем модальное окно
      setNewListName('');
      setShowCreateListModal(false);

    } catch (error) {
      console.error('Error creating list:', error);
      // alert(t('projects.failedToCreate'));
    }
  };

  // Удаление списка
  const handleDeleteList = async (listId) => {
    if (!window.confirm(t('project.deleteListConfirm'))) {
      return;
    }

    try {
      await boardsAPI.deleteList(listId);

      // Обновляем доску
      const boardRes = await boardsAPI.getBoard(board.id);
      setBoard(boardRes.data);

    } catch (error) {
      console.error('Error deleting list:', error);
      // alert(t('projects.failedToCreate'));
    }
  };

  // Создание карточки
  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await cardsAPI.createCard(selectedList.id, cardForm);
      await loadProjectData();

      setCardForm({ title: '', description: '', due_date: '' });
      setShowCardModal(false);
      setSelectedList(null);
    } catch (error) {
      console.error('Error creating card:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  // Редактирование карточки
  const handleSaveCard = async () => {
    try {
      // Сохраняем карточку
      await cardsAPI.updateCard(selectedCard.id, editingCardData);

      await refreshCardData();

      // Перезагружаем всю доску, чтобы изменения отобразились на карточках
      if (board) {
        const boardRes = await boardsAPI.getBoard(board.id);
        setBoard(boardRes.data);
      }

      setSelectedCard(null);

    } catch (error) {
      console.error('Error updating card:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  // Комментарии
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await commentsAPI.addComment(selectedCard.id, commentText);
      const newComment = response.data;
      
      // Обновляем данные карточки
      await refreshCardData();
      setCommentText('');
      
      // Показываем уведомление об успешном добавлении с упоминаниями
      // if (newComment.mentions && newComment.mentions.length > 0) {
      //   const mentionedUsers = newComment.mentions.map(user => user.username).join(', ');
      //   alert(`Комментарий добавлен. Упомянуты: ${mentionedUsers}`);
      // }
    } catch (error) {
      console.error('Error adding comment:', error);
      // alert(t('board.failedToAddComment'));
    }
  };

  // Назначение пользователей
  const handleAssignUser = async (userId) => {
    try {
      await cardsAPI.assignUser(selectedCard.id, userId);
      await refreshCardData();

      // Не создаем уведомление для себя
      if (userId !== currentUser.id) {
        try {
          await notificationsAPI.createAssignmentNotification({
            card_id: selectedCard.id,
            assigned_user_id: userId
          });
          console.log(`✅ Created assignment notification for user ${userId}`);
        } catch (notificationError) {
          console.error('Error creating assignment notification:', notificationError);
        }
      }

    } catch (error) {
      console.error('Error assigning user:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  // Метки
  const handleAddLabel = async (labelId) => {
    try {
      await labelsAPI.addLabelToCard(selectedCard.id, labelId);
      await refreshCardData();
    } catch (error) {
      console.error('Error adding label:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await labelsAPI.removeLabelFromCard(selectedCard.id, labelId);
      await refreshCardData();
    } catch (error) {
      console.error('Error removing label:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  // Создание новой метки и немедленное добавление в карточку
  const handleCreateAndAddLabel = async () => {
    if (!newLabel.name.trim()) return;

    try {
      // Создаем метку
      const labelResponse = await labelsAPI.createLabel(project.id, newLabel);
      const newLabelId = labelResponse.data.id;

      // Немедленно добавляем ее в карточку
      await labelsAPI.addLabelToCard(selectedCard.id, newLabelId);

      // Обновляем список меток проекта
      const labelsRes = await labelsAPI.getProjectLabels(project.id);
      setProjectLabels(labelsRes.data);

      // Обновляем данные карточки
      await refreshCardData();

      // Сбрасываем форму
      setNewLabel({ name: '', color: '#3B82F6' });
    } catch (error) {
      console.error('Error creating and adding label:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  // Чеклисты
  const handleCreateChecklist = async () => {
    if (!newChecklist.title.trim()) return;

    try {
      await checklistsAPI.createChecklist(selectedCard.id, newChecklist);
      setNewChecklist({ title: '' });
      await refreshCardData();
    } catch (error) {
      console.error('Error creating checklist:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleAddChecklistItem = async (checklistId) => {
    const text = newChecklistItems[checklistId];
    if (!text?.trim()) return;

    try {
      await checklistsAPI.createChecklistItem(checklistId, { text });
      setNewChecklistItems(prev => ({ ...prev, [checklistId]: '' }));
      await refreshCardData();
    } catch (error) {
      console.error('Error adding checklist item:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleToggleChecklistItem = async (itemId, completed) => {
    try {
      await checklistsAPI.updateChecklistItem(itemId, { completed });
      await refreshCardData();
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    try {
      await checklistsAPI.deleteChecklist(checklistId);
      await refreshCardData();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await checklistsAPI.deleteChecklistItem(itemId);
      await refreshCardData();
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleUpdateChecklistTitle = async (checklistId, newTitle) => {
    if (!newTitle.trim()) return;

    try {
      await checklistsAPI.updateChecklist(checklistId, { title: newTitle });
      await refreshCardData();
    } catch (error) {
      console.error('Error updating checklist title:', error);
    }
  };

  // Функции для Drag & Drop
  const handleDragStart = (event) => {
    if (!isGuestMode) {
      setActiveId(event.active.id);
    }
  };

  // Функция для удаления исполнителя из карточки
  const handleRemoveAssignee = async (cardId, assigneeId) => {
    try {
      console.log('Removing assignee:', assigneeId, 'from card:', cardId);

      await cardsAPI.removeAssignee(cardId, assigneeId);

      // Если удаляем из текущей выбранной карточки, обновляем её данные
      if (selectedCard && selectedCard.id === cardId) {
        await refreshCardData();
      }

      // Обновляем доску, чтобы изменения отобразились на всех карточках
      if (board) {
        const boardRes = await boardsAPI.getBoard(board.id);
        setBoard(boardRes.data);
      }

      console.log('Assignee removed successfully');
    } catch (error) {
      console.error('Error removing assignee:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleCreateDefaultChecklist = async () => {
    if (!selectedCard) return;

    try {
      const checklistResponse = await checklistsAPI.createChecklist(selectedCard.id, {
        title: 'Tasks'
      });

      // Создаем начальные пункты
      const defaultItems = [
        'Review requirements',
        'Design solution',
        'Implement features',
        'Testing',
        'Deployment'
      ];

      for (const text of defaultItems) {
        await checklistsAPI.createChecklistItem(checklistResponse.data.id, { text });
      }

      await refreshCardData();
    } catch (error) {
      console.error('Error creating default checklist:', error);
      // alert(t('board.failedToCreateCard'));
    }
  };

  const handleDragEnd = async (event) => {
    if (isGuestMode) return;

    const { active, over } = event;
    setActiveId(null);
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Находим исходный и целевой списки
    const activeList = board.lists.find(list =>
      list.cards?.some(card => card.id === activeId)
    );
    const overList = board.lists.find(list =>
      list.cards?.some(card => card.id === overId) || list.id === overId
    );

    if (!activeList || !overList) return;

    // Перемещение внутри одного списка
    if (activeList.id === overList.id) {
      const oldIndex = activeList.cards.findIndex(card => card.id === activeId);
      const newIndex = overList.cards.findIndex(card => card.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const updatedBoard = {
          ...board,
          lists: board.lists.map(list =>
            list.id === activeList.id
              ? {
                ...list,
                cards: arrayMove(list.cards, oldIndex, newIndex)
              }
              : list
          )
        };
        setBoard(updatedBoard);

        // Обновляем позицию на бэкенде
        try {
          await cardsAPI.updateCard(activeId, {
            position: newIndex,
            list_id: activeList.id
          });
        } catch (error) {
          console.error('Error updating card position:', error);
          await loadProjectData();
        }
      }
    }
    // Перемещение между списками
    else {
      const activeIndex = activeList.cards.findIndex(card => card.id === activeId);
      const overIndex = overList.cards.findIndex(card => card.id === overId);

      const activeCard = activeList.cards[activeIndex];

      // Обновляем локальное состояние
      const updatedBoard = {
        ...board,
        lists: board.lists.map(list => {
          if (list.id === activeList.id) {
            return {
              ...list,
              cards: list.cards.filter(card => card.id !== activeId)
            };
          }
          if (list.id === overList.id) {
            const newCards = [...list.cards];
            newCards.splice(overIndex >= 0 ? overIndex : list.cards.length, 0, activeCard);
            return {
              ...list,
              cards: newCards
            };
          }
          return list;
        })
      };
      setBoard(updatedBoard);

      // Обновляем карточку на бэкенде
      try {
        await cardsAPI.updateCard(activeId, {
          list_id: overList.id,
          position: overIndex >= 0 ? overIndex : overList.cards.length
        });
      } catch (error) {
        console.error('Error updating card list:', error);
        await loadProjectData();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 dark:text-white">{t('common.loading')}</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{t('board.boardNotFound')}</div>
        <Link to="/projects" className="btn btn-primary mt-4">
          {t('project.backToProjects')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {!isGuestMode && (
              <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400 dark:hover:text-blue-300">
                {t('project.backToProjects')}
              </Link>
            )}
            {isGuestMode && (
              <span className="text-blue-600 text-sm dark:text-blue-400">{t('project.guestViewMode')}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{project.description}</p>

          {/* Индикатор guest-режима */}
          {isGuestMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t('project.guestViewWarning')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Board */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">{t('project.projectBoard')}</h2>

          <div className="flex items-center space-x-3">
            {/* Фильтр по участникам - не показываем в guest режиме */}
            {!isGuestMode && members.length > 0 && (
              <AssigneeFilter
                members={members}
                selectedAssignees={filterAssignees}
                onFilterChange={handleFilterChange}
                onClearFilter={handleClearFilter}
              />
            )}

            {/* Team Members в заголовке - не показываем в guest режиме */}
            {!isGuestMode && members.length > 0 && (
              <TeamMembersDropdown members={members} />
            )}

            {/* Кнопка Invite People - только для ADMIN и не в guest режиме */}
            {!isGuestMode && currentUserRole === 'admin' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Users size={16} />
                <span>{t('project.invitePeople')}</span>
              </button>
            )}

            {/* Кнопка Add List - только для ADMIN и MEMBER и не в guest режиме */}
            {!isGuestMode && (currentUserRole === 'admin' || currentUserRole === 'member') && (
              <button
                onClick={() => setShowCreateListModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>{t('project.addList')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Display board with lists and cards */}
        {board && board.lists && board.lists.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {board.lists.map(list => (
                <SortableList
                  key={list.id}
                  list={list}
                  onAddCard={handleAddCardClick}
                  onCardClick={setSelectedCard}
                  onDeleteList={handleDeleteList}
                  currentUserRole={currentUserRole}
                  isGuestMode={isGuestMode}
                  filterAssignees={filterAssignees}
                />
              ))}

              {/* Кнопка добавления нового списка в конце - только для ADMIN и MEMBER и не в guest режиме */}
              {!isGuestMode && (currentUserRole === 'admin' || currentUserRole === 'member') && (
                <div className="flex-shrink-0 w-80">
                  <button
                    onClick={() => setShowCreateListModal(true)}
                    className="w-full h-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors border-2 border-dashed border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:border-gray-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus size={20} />
                      <span className="font-medium">{t('project.addAnotherList')}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeCard ? <CardPreview card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
            <Plus size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">{t('project.noLists')}</h3>
            <p className="text-gray-600 mb-4 dark:text-gray-400">{t('project.createFirstList')}</p>
            {!isGuestMode && (currentUserRole === 'admin' || currentUserRole === 'member') && (
              <button
                onClick={() => setShowCreateListModal(true)}
                className="btn btn-primary"
              >
                {t('project.createFirstList')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="modal-overlay">
          <div className="modal max-w-md">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('projects.createNewProject')}</h2>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label className="dark:text-gray-300">{t('common.title')} *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  placeholder={t('projects.enterProjectName')}
                  autoFocus
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                  }}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newListName.trim()}
                >
                  {t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('board.createCard')} {selectedList?.name}</h2>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label className="dark:text-gray-300">{t('board.cardTitle')} *</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder={t('board.enterCardTitle')}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="form-group">
                <label className="dark:text-gray-300">{t('common.description')}</label>
                <textarea
                  value={cardForm.description}
                  onChange={(e) => setCardForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder={t('board.enterCardDescription')}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="form-group">
                <label className="dark:text-gray-300">{t('board.dueDate')}</label>
                <input
                  type="date"
                  value={cardForm.due_date}
                  onChange={(e) => setCardForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    setSelectedList(null);
                  }}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('board.createCard')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Detail & Edit Modal - в guest режиме только просмотр */}
      {selectedCard && (
        <div className="modal-overlay">
          <div className="modal max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                {isGuestMode ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                        {t('project.guestViewMode')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCard.title}</h2>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editingCardData.title}
                    onChange={(e) => setEditingCardData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-2xl font-bold text-gray-900 w-full p-2 border border-transparent hover:border-gray-300 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:focus:border-blue-400"
                    placeholder={t('board.cardTitle')}
                  />
                )}
              </div>
              <div className="flex space-x-2">
                {!isGuestMode && (
                  <button
                    onClick={handleSaveCard}
                    className="btn btn-primary"
                  >
                    {t('common.save')}
                  </button>
                )}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2 dark:text-white">{t('common.description')}</h3>
                  {isGuestMode ? (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded dark:bg-gray-700 dark:text-gray-300">
                      {selectedCard.description || t('board.noDescription')}
                    </p>
                  ) : (
                    <textarea
                      value={editingCardData.description}
                      onChange={(e) => setEditingCardData(prev => ({ ...prev, description: e.target.value }))}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder={t('board.enterCardDescription')}
                    />
                  )}
                </div>

                {/* Due Date */}
                {selectedCard.due_date && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">{t('board.dueDate')}</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedCard.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Checklists */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center space-x-2 dark:text-white">
                      <CheckSquare size={20} />
                      <span>{t('board.checklists')}</span>
                    </h3>
                  </div>

                  {/* Single Checklist Display */}
                  {selectedCard?.checklists && selectedCard.checklists.length > 0 ? (
                    selectedCard.checklists.slice(0, 1).map(checklist => (
                      <div key={checklist.id} className="border border-gray-200 rounded-lg p-4 dark:border-gray-600">
                        <div className="flex items-center space-x-2 mb-3">
                          <input
                            type="text"
                            defaultValue={checklist.title}
                            onBlur={(e) => handleUpdateChecklistTitle(checklist.id, e.target.value)}
                            className="font-medium border border-transparent hover:border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none flex-1 dark:bg-gray-700 dark:text-white dark:hover:border-gray-500"
                          />
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1 dark:text-gray-400">
                            <span>
                              {checklist.completed_count || 0} of {checklist.total_count || 0} {t('common.completed')}
                            </span>
                            <span>
                              {checklist.total_count ? Math.round((checklist.completed_count / checklist.total_count) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${checklist.total_count ? (checklist.completed_count / checklist.total_count) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-2 mb-3">
                          {checklist.items?.map(item => (
                            <div key={item.id} className="flex items-center space-x-3 group">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600"
                              />
                              <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''} dark:text-gray-300`}>
                                {item.text}
                              </span>
                              <button
                                onClick={() => handleDeleteChecklistItem(item.id)}
                                className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add New Checklist Item */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newChecklistItems[checklist.id] || ''}
                            onChange={(e) => setNewChecklistItems(prev => ({
                              ...prev,
                              [checklist.id]: e.target.value
                            }))}
                            placeholder={t('board.addCommentPlaceholder')}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddChecklistItem(checklist.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddChecklistItem(checklist.id)}
                            disabled={!newChecklistItems[checklist.id]?.trim()}
                            className="btn btn-primary text-sm"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
                      <CheckSquare size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">{t('board.noChecklists')}</p>
                      <button
                        onClick={() => handleCreateDefaultChecklist()}
                        className="btn btn-primary mt-2 text-sm"
                      >
                        {t('board.createChecklist')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold mb-4 dark:text-white">{t('board.comments')}</h3>

                  {!isGuestMode && (
                    <div className="relative mb-4 mention-container">
                      <form onSubmit={handleAddComment}>
                        <textarea
                          value={commentText}
                          onChange={(e) => handleCommentChange(e.target.value)}
                          placeholder={t('board.addCommentPlaceholder')}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows="3"
                          onKeyDown={(e) => {
                            // Навигация по предложениям стрелками
                            if (showMentions) {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setMentionIndex(prev => prev < mentionSuggestions.length - 1 ? prev + 1 : prev);
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setMentionIndex(prev => prev > 0 ? prev - 1 : 0);
                              } else if (e.key === 'Enter' && showMentions && mentionSuggestions[mentionIndex]) {
                                e.preventDefault();
                                handleSelectMention(mentionSuggestions[mentionIndex]);
                              } else if (e.key === 'Escape') {
                                setShowMentions(false);
                              }
                            }
                          }}
                        />
                        
                        {/* Выпадающий список пользователей для упоминаний */}
                        {showMentions && mentionSuggestions.length > 0 && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            {mentionSuggestions.map((user, index) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectMention(user)}
                                className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  index === mentionIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {user.username[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {user.username}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-2">
                          <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="btn btn-primary"
                          >
                            {t('board.addComment')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedCard.comments?.map(comment => (
                      <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                              {comment.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.author?.username}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          {renderCommentWithMentions(comment.text, comment.mentions || [])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - в guest режиме показываем информацию только для чтения */}
              <div className="space-y-6">
                {isGuestMode ? (
                  /* Guest режим: только просмотр информации */
                  <>
                    {/* Assignees - показываем в guest режиме */}
                    {selectedCard.assignees && selectedCard.assignees.length > 0 && (
                      <div className="card">
                        <h3 className="font-semibold mb-3 flex items-center space-x-2 dark:text-white">
                          <Users size={18} />
                          <span>{t('board.assignees')}</span>
                        </h3>
                        <div className="space-y-2">
                          {selectedCard.assignees?.map(assignee => (
                            <div key={assignee.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded dark:bg-gray-700">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                {assignee.username?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm dark:text-gray-300">{assignee.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Labels - показываем в guest режиме */}
                    {selectedCard.labels && selectedCard.labels.length > 0 && (
                      <div className="card">
                        <h3 className="font-semibold mb-3 flex items-center space-x-2 dark:text-white">
                          <Tag size={18} />
                          <span>{t('board.labels')}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCard.labels?.map(label => (
                            <span
                              key={label.id}
                              className="px-2 py-1 text-xs rounded text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Info - показываем в guest режиме */}
                    <div className="card">
                      <h3 className="font-semibold mb-3 dark:text-white">{t('board.cardInfo')}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.created')}:</span>
                          <span className="dark:text-gray-300">{new Date(selectedCard.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.lastUpdated')}:</span>
                          <span className="dark:text-gray-300">{new Date(selectedCard.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.author')}:</span>
                          <span className="dark:text-gray-300">{selectedCard.created_by?.username}</span>
                        </div>
                        {selectedCard.due_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('board.dueDate')}:</span>
                            <span className="dark:text-gray-300">{new Date(selectedCard.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Режим редактирования для авторизованных пользователей */
                  <>
                    {/* Assignees */}
                    <div className="card">
                      <h3 className="font-semibold mb-3 flex items-center space-x-2 dark:text-white">
                        <Users size={18} />
                        <span>{t('board.assignees')}</span>
                      </h3>

                      {/* Current Assignees */}
                      <div className="space-y-2 mb-3">
                        {selectedCard.assignees?.map(assignee => (
                          <div key={assignee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-700">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                {assignee.username?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm dark:text-gray-300">{assignee.username}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveAssignee(selectedCard.id, assignee.id)}
                              className="text-red-600 hover:text-red-800 text-sm dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Assign New User */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignUser(parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">{t('board.assignTeamMember')}...</option>
                        {availableMembers
                          .filter(member => !selectedCard.assignees?.some(assignee => assignee.id === member.id))
                          .map(member => (
                            <option key={member.id} value={member.id}>
                              {member.username}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Labels */}
                    <div className="card">
                      <h3 className="font-semibold mb-3 flex items-center space-x-2 dark:text-white">
                        <Tag size={18} />
                        <span>{t('board.labels')}</span>
                      </h3>

                      {/* Current Labels */}
                      <div className="space-y-2 mb-3">
                        {selectedCard.labels?.map(label => (
                          <div key={label.id} className="flex items-center justify-between p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: label.color }}
                              ></div>
                              <span className="text-sm dark:text-gray-300">{label.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveLabel(label.id)}
                              className="text-red-600 hover:text-red-800 text-sm dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Existing Label */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddLabel(parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">{t('board.addExistingLabel')}...</option>
                        {projectLabels
                          .filter(label => !selectedCard.labels?.some(cardLabel => cardLabel.id === label.id))
                          .map(label => (
                            <option key={label.id} value={label.id}>
                              {label.name}
                            </option>
                          ))
                        }
                      </select>

                      {/* Create New Label */}
                      <div className="border-t pt-3 dark:border-gray-600">
                        <h4 className="text-sm font-medium mb-2 dark:text-gray-300">{t('board.createNewLabel')}</h4>

                        {/* Поле ввода названия метки */}
                        <div className="mb-2">
                          <input
                            type="text"
                            value={newLabel.name}
                            onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t('board.labelName')}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateAndAddLabel();
                              }
                            }}
                          />
                        </div>

                        {/* Палитра цветов */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {predefinedColors.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                                className={`w-6 h-6 rounded border-2 ${newLabel.color === color ? 'border-gray-800 dark:border-gray-300' : 'border-transparent'
                                  } hover:border-gray-400 transition-colors`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Кнопка создания - теперь внизу */}
                        <button
                          onClick={handleCreateAndAddLabel}
                          disabled={!newLabel.name.trim()}
                          className="w-full btn btn-primary text-sm"
                        >
                          {t('board.createLabel')}
                        </button>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="card">
                      <h3 className="font-semibold mb-3 dark:text-white">{t('board.cardInfo')}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.created')}:</span>
                          <span className="dark:text-gray-300">{new Date(selectedCard.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.lastUpdated')}:</span>
                          <span className="dark:text-gray-300">{new Date(selectedCard.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{t('board.author')}:</span>
                          <span className="dark:text-gray-300">{selectedCard.created_by?.username}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Invitation Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal max-w-md">
            <h2 className="text-xl font-semibold mb-4">{t('invitations.inviteToProject')}</h2>

            {!generatedInvite ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label>{t('invitations.role')}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">{t('roles.viewer')}</option>
                    <option value="member">{t('roles.member')}</option>
                    <option value="admin">{t('roles.admin')}</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleCreateInvitation}
                    className="btn btn-primary"
                  >
                    {t('invitations.generateInviteLink')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">{t('invitations.inviteLink')}:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedInvite.invite_url}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInvite.invite_url);
                        // alert(t('invitations.linkCopied'));
                      }}
                      className="btn btn-primary text-sm"
                    >
                      {t('invitations.copy')}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setGeneratedInvite(null);
                    }}
                    className="btn btn-primary"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;