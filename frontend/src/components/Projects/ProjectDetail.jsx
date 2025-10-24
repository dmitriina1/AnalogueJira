import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, boardsAPI, cardsAPI, commentsAPI } from '../../services/api';
import { Plus, Users, MessageSquare, Clock, User } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Компонент карточки для Drag & Drop
const SortableCard = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded shadow border p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
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
                  className="w-8 h-2 rounded-full"
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
            <div className="flex items-center space-x-2">
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
      </div>
    </div>
  );
};

// Компонент списка
const BoardList = ({ list, onAddCard, onCardClick }) => {
  return (
    <div className="flex-shrink-0 w-64 bg-gray-100 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">{list.name}</h3>
        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
          {list.cards ? list.cards.length : 0}
        </span>
      </div>

      <SortableContext items={list.cards ? list.cards.map(card => card.id) : []} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[50px]">
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

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

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

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await cardsAPI.createCard(selectedList.id, cardForm);
      
      // Перезагружаем данные проекта чтобы увидеть новую карточку
      await loadProjectData();
      
      setCardForm({ title: '', description: '', due_date: '' });
      setShowCardModal(false);
      setSelectedList(null);
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await commentsAPI.addComment(selectedCard.id, commentText);
      await loadProjectData();
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id;
    const overId = over.id;

    // Находим списки
    const activeList = board.lists.find(list => 
      list.cards?.some(card => card.id === activeId)
    );
    const overList = board.lists.find(list => 
      list.cards?.some(card => card.id === overId) || list.id === overId
    );

    if (!activeList || !overList) return;

    // Перемещение между списками
    if (activeList.id !== overList.id) {
      try {
        await cardsAPI.updateCard(activeId, { 
          list_id: overList.id,
          position: 0
        });
        // Перезагружаем данные
        await loadProjectData();
      } catch (error) {
        console.error('Error moving card:', error);
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Board */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Project Board</h2>
          </div>

          {/* Display board with lists and cards */}
          {board && board.lists && board.lists.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {board.lists.map(list => (
                  <BoardList
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
            </DndContext>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Plus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No board yet</h3>
              <p className="text-gray-600">Board will be created automatically when you create a project</p>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <span className="text-sm text-gray-500">{members.length} members</span>
          </div>

          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.user.username}</p>
                    <p className="text-sm text-gray-500 capitalize">{member.role}</p>
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
      </div>

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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;