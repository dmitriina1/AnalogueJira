import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { projectsAPI } from '../../services/api';
import { Plus, Users, Calendar, Search } from 'lucide-react';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const navigate = useNavigate();
  const t = useTranslation();

  // Функция для правильного склонения слов в русском языке
  const getPlural = (count, one, few, many) => {
    if (count === 1) return one;
    if (count >= 2 && count <= 4) return few;
    return many;
  };

  // Функция для форматирования количества участников
  const formatMembersCount = (count) => {
    const membersCount = count || 0;
    return `${membersCount} ${getPlural(
      membersCount,
      t('projects.member_one', 'участник'),
      t('projects.member_few', 'участника'),
      t('projects.member_many', 'участников')
    )}`;
  };

  // Функция для форматирования количества досок
  const formatBoardsCount = (count) => {
    const boardsCount = count || 0;
    return `${boardsCount} ${getPlural(
      boardsCount,
      t('projects.board_one', 'доска'),
      t('projects.board_few', 'доски'),
      t('projects.board_many', 'досок')
    )}`;
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data);
      setFilteredProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await projectsAPI.createProject(formData);
      const newProject = response.data;
      
      navigate(`/projects/${newProject.id}`);
      
      setFormData({ name: '', description: '' });
      setShowProjectModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(t('projects.failedToCreate'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
          <p className="text-gray-600 mt-1">{t('projects.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>{t('projects.newProject')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('projects.searchProjects')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card hover:shadow-lg transition-shadow duration-300 group block"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                {formatMembersCount(project.member_count || 0)}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description || t('projects.noDescription')}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>{formatBoardsCount(project.boards?.length || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <span className="btn btn-primary text-sm px-3 py-1">
                {t('projects.open')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && projects.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('projects.noProjects')}</h3>
          <p className="text-gray-600 mb-4">{t('projects.createFirstProject')}</p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="btn btn-primary"
          >
            {t('projects.createProject')}
          </button>
        </div>
      )}

      {filteredProjects.length === 0 && projects.length > 0 && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('projects.noProjectsFound')}</h3>
          <p className="text-gray-600">{t('projects.adjustSearch')}</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay fade-in">
          <div className="modal">
            <h2 className="text-xl font-semibold mb-4">{t('projects.createNewProject')}</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>{t('projects.projectName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder={t('projects.enterProjectName')}
                />
              </div>
              <div className="form-group">
                <label>{t('projects.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder={t('projects.enterProjectDescription')}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('projects.createProject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;