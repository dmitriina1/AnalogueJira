import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, invitationsAPI, boardsAPI } from '../../services/api';
import { Plus, Users, Settings, Mail, Trash2, MoreVertical } from 'lucide-react';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });

  const [boardForm, setBoardForm] = useState({
    name: '',
    description: ''
  });

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
      // Загружаем доски проекта
      const boardsData = projectRes.data.boards || [];
      setBoards(boardsData);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      await invitationsAPI.inviteUser(projectId, inviteForm);
      setInviteForm({ email: '', role: 'member' });
      setShowInviteModal(false);
      alert('Invitation sent successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const response = await boardsAPI.createBoard(projectId, boardForm);
      setBoards(prev => [...prev, response.data]);
      setBoardForm({ name: '', description: '' });
      setShowBoardModal(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Users size={16} />
            <span>Invite Members</span>
          </button>
          <button
            onClick={() => setShowBoardModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>New Board</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boards Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Boards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map(board => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="font-semibold text-lg mb-2">{board.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {board.description || 'No description'}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{board.lists?.length || 0} lists</span>
                  <span>
                    {new Date(board.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {boards.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Plus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
              <p className="text-gray-600 mb-4">Create your first board to start organizing tasks</p>
              <button
                onClick={() => setShowBoardModal(true)}
                className="btn btn-primary"
              >
                Create Board
              </button>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div>
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="text-xl font-semibold mb-4">Invite to Project</h2>
            <form onSubmit={handleInviteUser}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Enter user's email"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="form-group select"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="text-xl font-semibold mb-4">Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label>Board Name</label>
                <input
                  type="text"
                  value={boardForm.name}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Enter board name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={boardForm.description}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder="Enter board description"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBoardModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;