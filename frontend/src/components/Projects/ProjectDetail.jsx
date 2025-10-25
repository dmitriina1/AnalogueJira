import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, boardsAPI, cardsAPI, commentsAPI, labelsAPI, checklistsAPI, usersAPI } from '../../services/api';
import { Plus, Users, MessageSquare, Clock, GripVertical, CheckSquare, Tag, X, Trash2, ChevronDown, MoreHorizontal } from 'lucide-react';
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

// SortableCard компонент
const SortableCard = ({ card, onClick }) => {
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
      className="bg-white rounded-lg shadow-sm border p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
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

          <h4 className="font-medium text-gray-900 mb-2">
            {card.title}
          </h4>

          {/* Card Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500">
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
                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                    title={assignee.username}
                  >
                    {assignee.username?.[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab"
        >
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
};

// SortableList компонент
const SortableList = ({ list, onAddCard, onCardClick, onDeleteList }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <div 
          className="flex items-center space-x-2 cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900">{list.name}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
            {list.cards ? list.cards.length : 0}
          </span>
          
          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    onDeleteList(list.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  <Trash2 size={16} />
                  <span>Delete List</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SortableContext items={list.cards ? list.cards.map(card => card.id) : []} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px]">
          {list.cards && list.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onClick={onCardClick}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddCard(list)}
        className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors"
      >
        <Plus size={16} />
        <span>Add a card</span>
      </button>
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
    <div className="bg-white rounded-lg shadow-lg border p-4 w-80 transform rotate-3">
      <h4 className="font-medium text-gray-900 mb-2">
        {card.title}
      </h4>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Checklist Progress */}
          {checklistProgress && (
            <div className="flex items-center space-x-1">
              <CheckSquare size={14} />
              <span>{checklistProgress.completed_count || 0}/{checklistProgress.total_count || 0}</span>
            </div>
          )}
          
          {card.due_date && (
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{new Date(card.due_date).toLocaleDateString()}</span>
            </div>
          )}
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare size={14} />
              <span>{card.comments.length}</span>
            </div>
          )}
        </div>
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {card.assignees.map(assignee => (
              <div
                key={assignee.id}
                className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
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
  const [isOpen, setIsOpen] = useState(false);

  // Показываем только первых 5 участников в превью
  const displayMembers = members.slice(0, 5);
  const hasMoreMembers = members.length > 5;

  return (
    <div className="relative">
      {/* Кнопка с аватарками */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex -space-x-2">
          {displayMembers.map(member => (
            <div
              key={member.id}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white"
              title={member.user.username}
            >
              {member.user.username[0].toUpperCase()}
            </div>
          ))}
          {hasMoreMembers && (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs border-2 border-white">
              +{members.length - 5}
            </div>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-10">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500">{members.length} members</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role === 'admin' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Admin
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
  const { projectId } = useParams();
  
  // Основные состояния
  const [project, setProject] = useState(null);
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для карточек и модальных окон
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  
  // Новые состояния для управления списками
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // Состояния для формы создания карточки
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  
  // Состояния для комментариев
  const [commentText, setCommentText] = useState('');
  
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
      const [projectRes, membersRes] = await Promise.all([
        projectsAPI.getProject(projectId),
        projectsAPI.getProjectMembers(projectId)
      ]);
      
      setProject(projectRes.data);
      setMembers(membersRes.data);
      
      // Загружаем доску проекта
      if (projectRes.data.boards && projectRes.data.boards.length > 0) {
        const boardId = projectRes.data.boards[0].id;
        const boardRes = await boardsAPI.getBoard(boardId);
        setBoard(boardRes.data);
      }
      
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
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

      const [labelsRes, membersRes] = await Promise.all([
        labelsAPI.getProjectLabels(project.id),
        usersAPI.getUsers()
      ]);
      
      setProjectLabels(labelsRes.data);
      setAvailableMembers(membersRes.data);
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
      alert('Failed to create list');
    }
  };

  // Удаление списка
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? All cards in this list will be deleted.')) {
      return;
    }

    try {
      await boardsAPI.deleteList(listId);
      
      // Обновляем доску
      const boardRes = await boardsAPI.getBoard(board.id);
      setBoard(boardRes.data);
      
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
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
      alert('Failed to create card');
    }
  };

  // Редактирование карточки
  const handleSaveCard = async () => {
    try {
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
      alert('Failed to update card');
    }
  };

  // Комментарии
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await commentsAPI.addComment(selectedCard.id, commentText);
      await refreshCardData();
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  // Назначение пользователей
  const handleAssignUser = async (userId) => {
    try {
      await cardsAPI.assignUser(selectedCard.id, userId);
      await refreshCardData();
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user');
    }
  };

  const handleRemoveAssignee = async (userId) => {
    try {
      await cardsAPI.removeAssignee(selectedCard.id, userId);
      await refreshCardData();
    } catch (error) {
      console.error('Error removing assignee:', error);
      alert('Failed to remove assignee');
    }
  };

  // Метки
  const handleAddLabel = async (labelId) => {
    try {
      await labelsAPI.addLabelToCard(selectedCard.id, labelId);
      await refreshCardData();
    } catch (error) {
      console.error('Error adding label:', error);
      alert('Failed to add label');
    }
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await labelsAPI.removeLabelFromCard(selectedCard.id, labelId);
      await refreshCardData();
    } catch (error) {
      console.error('Error removing label:', error);
      alert('Failed to remove label');
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
      alert('Failed to create label');
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
      alert('Failed to create checklist');
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
      alert('Failed to add checklist item');
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
      alert('Failed to delete checklist');
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await checklistsAPI.deleteChecklistItem(itemId);
      await refreshCardData();
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      alert('Failed to delete checklist item');
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
    setActiveId(event.active.id);
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
      alert('Failed to create checklist');
    }
  };

  const handleDragEnd = async (event) => {
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
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Project not found</div>
        <Link to="/projects" className="btn btn-primary mt-4">
          Back to Projects
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
            <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Projects
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
      </div>

      {/* Project Board - теперь занимает всю ширину */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Project Board</h2>
          
          <div className="flex items-center space-x-3">
            {/* Team Members в заголовке */}
            {members.length > 0 && (
              <TeamMembersDropdown members={members} />
            )}
            
            {/* Кнопка создания нового списка */}
            <button
              onClick={() => setShowCreateListModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add List</span>
            </button>
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
                  onAddCard={(list) => {
                    setSelectedList(list);
                    setShowCardModal(true);
                  }}
                  onCardClick={setSelectedCard}
                  onDeleteList={handleDeleteList}
                />
              ))}
              
              {/* Кнопка добавления нового списка в конце */}
              <div className="flex-shrink-0 w-80">
                <button
                  onClick={() => setShowCreateListModal(true)}
                  className="w-full h-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors border-2 border-dashed border-gray-300"
                >
                  <div className="flex items-center space-x-2">
                    <Plus size={20} />
                    <span className="font-medium">Add another list</span>
                  </div>
                </button>
              </div>
            </div>

            <DragOverlay>
              {activeCard ? <CardPreview card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Plus size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
            <p className="text-gray-600 mb-4">Create your first list to get started</p>
            <button
              onClick={() => setShowCreateListModal(true)}
              className="btn btn-primary"
            >
              Create First List
            </button>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="modal-overlay">
          <div className="modal max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New List</h2>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label>List Name *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  placeholder="Enter list name"
                  autoFocus
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newListName.trim()}
                >
                  Create List
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
            <h2 className="text-xl font-semibold mb-4">Create Card in {selectedList?.name}</h2>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter card title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={cardForm.description}
                  onChange={(e) => setCardForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder="Enter card description"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={cardForm.due_date}
                  onChange={(e) => setCardForm(prev => ({ ...prev, due_date: e.target.value }))}
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Detail & Edit Modal */}
      {selectedCard && (
        <div className="modal-overlay">
          <div className="modal max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  value={editingCardData.title}
                  onChange={(e) => setEditingCardData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold text-gray-900 w-full p-2 border border-transparent hover:border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Card title"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveCard}
                  className="btn btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
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
                  <h3 className="font-semibold mb-2">Description</h3>
                  <textarea
                    value={editingCardData.description}
                    onChange={(e) => setEditingCardData(prev => ({ ...prev, description: e.target.value }))}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a description..."
                  />
                </div>

                {/* Due Date */}
                <div>
                  <h3 className="font-semibold mb-2">Due Date</h3>
                  <input
                    type="date"
                    value={editingCardData.due_date}
                    onChange={(e) => setEditingCardData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Checklists */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <CheckSquare size={20} />
                      <span>Checklist</span>
                    </h3>
                  </div>

                  {/* Single Checklist Display */}
                  {selectedCard?.checklists && selectedCard.checklists.length > 0 ? (
                    selectedCard.checklists.slice(0, 1).map(checklist => (
                      <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <input
                            type="text"
                            defaultValue={checklist.title}
                            onBlur={(e) => handleUpdateChecklistTitle(checklist.id, e.target.value)}
                            className="font-medium border border-transparent hover:border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none flex-1"
                          />
                        </div>
                        
                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>
                              {checklist.completed_count || 0} of {checklist.total_count || 0} completed
                            </span>
                            <span>
                              {checklist.total_count ? Math.round((checklist.completed_count / checklist.total_count) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
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
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                {item.text}
                              </span>
                              <button
                                onClick={() => handleDeleteChecklistItem(item.id)}
                                className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            placeholder="Add an item..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <CheckSquare size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No checklist found</p>
                      <button
                        onClick={() => handleCreateDefaultChecklist()}
                        className="btn btn-primary mt-2 text-sm"
                      >
                        Create Checklist
                      </button>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold mb-4">Comments</h3>
                  
                  <form onSubmit={handleAddComment} className="mb-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="btn btn-primary"
                      >
                        Add Comment
                      </button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    {selectedCard.comments?.map(comment => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                              {comment.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium">{comment.author?.username}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Assignees */}
                <div className="card">
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <Users size={18} />
                    <span>Assignees</span>
                  </h3>
                  
                  {/* Current Assignees */}
                  <div className="space-y-2 mb-3">
                    {selectedCard.assignees?.map(assignee => (
                      <div key={assignee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {assignee.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm">{assignee.username}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignee(assignee.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
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
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Assign a team member...</option>
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
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <Tag size={18} />
                    <span>Labels</span>
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
                          <span className="text-sm">{label.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveLabel(label.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
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
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Add existing label...</option>
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
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Create New Label</h4>
                    
                    {/* Поле ввода названия метки */}
                    <div className="mb-2">
                      <input
                        type="text"
                        value={newLabel.name}
                        onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Label name"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className={`w-6 h-6 rounded border-2 ${
                              newLabel.color === color ? 'border-gray-800' : 'border-transparent'
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
                      Create Label
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="card">
                  <h3 className="font-semibold mb-3">Card Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{new Date(selectedCard.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span>{new Date(selectedCard.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Author:</span>
                      <span>{selectedCard.created_by?.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;