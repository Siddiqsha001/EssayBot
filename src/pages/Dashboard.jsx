import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const recentActivities = [
    { id: 1, action: 'Submitted essay', title: 'Climate Change Impacts', date: '2023-06-15', status: 'Reviewed' },
    { id: 2, action: 'Started draft', title: 'AI Ethics Paper', date: '2023-06-10', status: 'In Progress' },
    { id: 3, action: 'Received feedback', title: 'Modern Poetry Analysis', date: '2023-06-05', status: 'Completed' },
  ];

  const upcomingTasks = [
    { id: 1, task: 'Revise argumentative essay', due: '2023-06-20', priority: 'High' },
    { id: 2, task: 'Read assigned materials', due: '2023-06-18', priority: 'Medium' },
    { id: 3, task: 'Outline research paper', due: '2023-06-25', priority: 'Low' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fullscreen">
      <main className="main-content compact">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="welcome-message">
              <h1>Dashboard</h1>
              <p>Welcome back, {currentUser?.displayName || 'User'}!</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary">New Essay</button>
            </div>
          </div>

          <div className="stats-grid">
            {[
              { title: 'Total Essays', value: '12', change: '+2 from last month', iconPath: 'M9 12h6m-6 4h6m2 5H7...' },
              { title: 'In Progress', value: '3', change: '1 needs feedback', iconPath: 'M12 8v4l3 3m6-3a9 9...' },
              { title: 'Completed', value: '8', change: '90% satisfaction', iconPath: 'M9 12l2 2 4-4m6 2a9...' },
              { title: 'Avg. Score', value: '87%', change: '+5% improvement', iconPath: 'M13 7h8m0 0v8m0...' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="stat-content">
                  <h3>{item.title}</h3>
                  <p className="value">{item.value}</p>
                  <p className={`change ${item.change.includes('+') ? 'positive' : ''}`}>{item.change}</p>
                </div>
                <div className="icon-wrapper">
                  <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="dashboard-tabs">
            <nav className="tabs-nav">
              {['Overview', 'Analytics', 'Documents', 'Calendar'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`tab-button ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="content-area">
            <motion.div
              className="activity-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-header">
                <h2>Recent Activities</h2>
                <button className="view-all">View All</button>
              </div>
              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <svg className="activity-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="activity-details">
                      <div className="activity-header">
                        <h3>{activity.action}: {activity.title}</h3>
                        <span className="activity-date">{activity.date}</span>
                      </div>
                      <p className="activity-status">
                        Status: <span className={`status-badge ${activity.status.toLowerCase().replace(' ', '-')}`}>{activity.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="task-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="section-header">
                <h2>Upcoming Tasks</h2>
                <button className="add-task">Add Task</button>
              </div>
              <div className="tasks-list">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-header">
                      <h3>{task.task}</h3>
                      <span className={`task-priority ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="task-due">Due: {task.due}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
