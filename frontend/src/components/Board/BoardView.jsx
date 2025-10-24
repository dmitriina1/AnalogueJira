import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cardsAPI, commentsAPI } from '../../services/api';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  User, 
  CheckSquare,
  GripVertical
} from 'lucide-react';

// Компонент для отображения карточки в DragOverlay
const CardPreview = ({ card }) => {
  if (!card) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 w-80 transform rotate-3">
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
          {/* Due Date */}
          {card.due_date && (
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>
                {new Date(card.due_date).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Checklist Progress */}
          {card.checklists && card.checklists.length > 0 && (
            <div className="flex items-center space-x-1">
              <CheckSquare size={14} />
              <span>
                {card.checklists.reduce((acc, checklist) => 
                  acc + (checklist.items?.filter(item => item.completed).length || 0), 0
                )}/{card.checklists.reduce((acc, checklist) => 
                  acc + (checklist.items?.length || 0), 0
                )}
              </span>
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
  );
};

// Sortable компонент для карточки
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
              {/* Due Date */}
              {card.due_date && (
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>
                    {new Date(card.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Checklist Progress */}
              {card.checklists && card.checklists.length > 0 && (
                <div className="flex items-center space-x-1">
                  <CheckSquare size={14} />
                  <span>
                    {card.checklists.reduce((acc, checklist) => 
                      acc + (checklist.items?.filter(item => item.completed).length || 0), 0
                    )}/{card.checklists.reduce((acc, checklist) => 
                      acc + (checklist.items?.length || 0), 0
                    )}
                  </span>
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

// Sortable компонент для списка
const SortableList = ({ list, onAddCard, onCardClick }) => {
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
        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
          {list.cards ? list.cards.length : 0}
        </span>
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

      {/* Add Card Button */}
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

const BoardView = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

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

  const loadBoardData = async () => {
    try {
      // Временные данные для демонстрации
      setTimeout(() => {
        setBoard({
          id: boardId,
          name: 'Development Board',
          description: 'Main development tasks',
          lists: [
            {
              id: 1,
              name: 'To Do',
              position: 0,
              cards: [
                {
                  id: 1,
                  title: 'Setup development environment',
                  description: 'Configure the development environment for the new project',
                  position: 0,
                  due_date: '2024-02-15',
                  created_by: { username: 'admin', avatar_url: null },
                  assignees: [],
                  labels: [],
                  checklists: [],
                  comments: []
                }
              ]
            },
            {
              id: 2,
              name: 'In Progress',
              position: 1,
              cards: [
                {
                  id: 2,
                  title: 'Design database schema',
                  description: 'Create the initial database schema design',
                  position: 0,
                  due_date: '2024-02-10',
                  created_by: { username: 'admin', avatar_url: null },
                  assignees: [{ username: 'admin', avatar_url: null }],
                  labels: [{ name: 'Backend', color: '#FF6B6B' }],
                  checklists: [
                    {
                      id: 1,
                      title: 'Database Tasks',
                      items: [
                        { id: 1, text: 'Design tables', completed: true },
                        { id: 2, text: 'Define relationships', completed: false }
                      ]
                    }
                  ],
                  comments: [
                    {
                      id: 1,
                      text: 'Started working on the schema design',
                      author: { username: 'admin' },
                      created_at: '2024-02-01T10:00:00Z'
                    }
                  ]
                }
              ]
            },
            {
              id: 3,
              name: 'Done',
              position: 2,
              cards: []
            }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading board:', error);
      setLoading(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      const response = await cardsAPI.createCard(selectedList.id, cardForm);
      
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(list => 
          list.id === selectedList.id 
            ? { 
                ...list, 
                cards: [...(list.cards || []), { ...response.data, id: Date.now() }] 
              }
            : list
        )
      }));
      
      setCardForm({ title: '', description: '', due_date: '' });
      setShowCardModal(false);
      setSelectedList(null);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await commentsAPI.addComment(selectedCard.id, commentText);
      
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(list => ({
          ...list,
          cards: list.cards?.map(card =>
            card.id === selectedCard.id
              ? { 
                  ...card, 
                  comments: [...(card.comments || []), response.data] 
                }
              : card
          )
        }))
      }));

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeList = board.lists.find(list => 
      list.cards?.some(card => card.id === activeId)
    );
    const overList = board.lists.find(list => 
      list.cards?.some(card => card.id === overId) || list.id === overId
    );

    if (!activeList || !overList) return;

    // Moving within the same list
    if (activeList.id === overList.id) {
      const oldIndex = activeList.cards.findIndex(card => card.id === activeId);
      const newIndex = overList.cards.findIndex(card => card.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        setBoard(prev => ({
          ...prev,
          lists: prev.lists.map(list =>
            list.id === activeList.id
              ? {
                  ...list,
                  cards: arrayMove(list.cards, oldIndex, newIndex)
                }
              : list
          )
        }));
      }
    } 
    // Moving between lists
    else {
      const activeIndex = activeList.cards.findIndex(card => card.id === activeId);
      const overIndex = overList.cards.findIndex(card => card.id === overId);
      
      const activeCard = activeList.cards[activeIndex];

      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(list => {
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
      }));

      // Update card's list_id in backend
      cardsAPI.updateCard(activeId, { list_id: overList.id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!board) {
    return <div>Board not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
        <p className="text-gray-600">{board.description}</p>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={board.lists.map(list => list.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {board.lists.map(list => (
              <SortableList
                key={list.id}
                list={list}
                onAddCard={(list) => {
                  setSelectedList(list);
                  setShowCardModal(true);
                }}
                onCardClick={setSelectedCard}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCard ? <CardPreview card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create Card Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Create Card</h2>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label>Title</label>
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

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="modal-overlay">
          <div className="modal max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">{selectedCard.title}</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedCard.description || 'No description provided'}
                  </p>
                </div>

                {/* Checklists */}
                {selectedCard.checklists?.map(checklist => (
                  <div key={checklist.id}>
                    <h3 className="font-semibold mb-2">{checklist.title}</h3>
                    <div className="space-y-2">
                      {checklist.items?.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            className="rounded text-blue-600"
                            readOnly
                          />
                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Comments */}
                <div>
                  <h3 className="font-semibold mb-4">Comments</h3>
                  
                  <form onSubmit={handleAddComment} className="mb-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
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
                {/* Due Date */}
                {selectedCard.due_date && (
                  <div>
                    <h3 className="font-semibold mb-2">Due Date</h3>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock size={16} />
                      <span>{new Date(selectedCard.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                {/* Assignees */}
                <div>
                  <h3 className="font-semibold mb-2">Assignees</h3>
                  <div className="space-y-2">
                    {selectedCard.assignees?.map(assignee => (
                      <div key={assignee.id} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          {assignee.username?.[0]?.toUpperCase()}
                        </div>
                        <span>{assignee.username}</span>
                      </div>
                    ))}
                    {(!selectedCard.assignees || selectedCard.assignees.length === 0) && (
                      <p className="text-gray-500 text-sm">No assignees</p>
                    )}
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <h3 className="font-semibold mb-2">Labels</h3>
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
                    {(!selectedCard.labels || selectedCard.labels.length === 0) && (
                      <p className="text-gray-500 text-sm">No labels</p>
                    )}
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

export default BoardView;