import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, ChartBarIcon, DocumentIcon, UserIcon } from '@heroicons/react/outline';

const DashboardNav = () => {
  return (
    <motion.nav 
      className="top-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="nav-logo">
        <h1>EssayMaster AI</h1>
      </div>
      <div className="nav-items">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <HomeIcon className="nav-icon" /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/essaybot" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <DocumentIcon className="nav-icon" /> <span>AI EssayBot</span>
        </NavLink>
        <NavLink to="/aitester" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ChartBarIcon className="nav-icon" /> <span>Test AI</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserIcon className="nav-icon" /> <span>Profile</span>
        </NavLink>
      </div>
    </motion.nav>
  );
};

export default DashboardNav;
