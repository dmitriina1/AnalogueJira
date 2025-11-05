import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, invitationsAPI, userAPI } from '../../services/api';
import { Plus, Users, Calendar, Bell, Clock, Activity } from 'lucide-react';

const Dashboard = () => {
  const [recentProjects, setRecentProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
    try {
      const [projectsRes, invitationsRes, assignedCountRes] = await Promise.all([
        projectsAPI.getProjects(),
        invitationsAPI.getInvitations(),
        userAPI.getAssignedCardsCount()  // Новый запрос
      ]);
      
      const projects = projectsRes.data.slice(0, 3);
      setRecentProjects(projects);
      setInvitations(invitationsRes.data);
      setAssignedTasksCount(assignedCountRes.data.count);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await invitationsAPI.acceptInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await invitationsAPI.rejectInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-blue-100">Here's what's happening with your projects today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Users className="mx-auto text-blue-500 mb-2" size={24} />
          <h3 className="font-semibold text-gray-900">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-600">{recentProjects.length}</p>
        </div>
        
        <div className="card text-center">
          <Activity className="mx-auto text-green-500 mb-2" size={24} />
          <h3 className="font-semibold text-gray-900">Active Tasks</h3>
          <p className="text-2xl font-bold text-green-600">{assignedTasksCount}</p>
        </div>
        
        <div className="card text-center">
          <Clock className="mx-auto text-orange-500 mb-2" size={24} />
          <h3 className="font-semibold text-gray-900">Pending</h3>
          <p className="text-2xl font-bold text-orange-600">{invitations.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link to="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentProjects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {project.boards?.length || 0} boards • {project.member_count || 0} members
                  </p>
                </div>
                <Calendar size={16} className="text-gray-400" />
              </Link>
            ))}
            
            {recentProjects.length === 0 && (
              <div className="text-center py-4">
                <Users className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500">No projects yet</p>
                <Link to="/projects" className="btn btn-primary mt-2 text-sm">
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="text-orange-500" size={20} />
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
            </div>
            
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {invitation.project_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Invited by: {invitation.invited_by?.username}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="btn btn-primary text-xs px-2 py-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(invitation.id)}
                      className="btn btn-secondary text-xs px-2 py-1"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/projects"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <Plus size={24} className="text-gray-400 group-hover:text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                New Project
              </span>
            </Link>
            
            <Link
              to="/projects"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <Users size={24} className="text-gray-400 group-hover:text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                Manage Teams
              </span>
            </Link>
            
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group cursor-not-allowed opacity-50">
              <Activity size={24} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Reports
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group cursor-not-allowed opacity-50">
              <Calendar size={24} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Calendar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;