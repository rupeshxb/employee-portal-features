import React, { useState, useEffect } from 'react';
import '../App.css'; 

const TeamUpdates = () => {
  // --- STATE ---
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [dateFilter, setDateFilter] = useState('Today'); 
  // Default to today's date in YYYY-MM-DD format
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Dropdown Data States
  const [projectList, setProjectList] = useState([]);
  // UPDATED: roleList is now state, initialized with default
  const [roleList, setRoleList] = useState([
    'All Roles', 
    'Frontend Developer', 
    'Backend Developer', 
    'Full Stack Developer',
    'UI/UX Designer', 
    'QA Engineer', 
    'DevOps Engineer', 
    'Project Manager',
    'HR',
    'Intern'
]);

  // --- HELPER: Get Token Safely ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    };
  };

  // --- HELPER: Fix Image URL ---
  const getImageUrl = (avatarPath) => {
    // UPDATED: Return null if no avatar to trigger Initials UI
    if (!avatarPath) return null;
    
    // 1. If it's already a full URL, use it
    if (avatarPath.startsWith('http')) return avatarPath;
    
    // 2. If it starts with /media, prepend domain
    if (avatarPath.startsWith('/media')) {
        return `http://127.0.0.1:8000${avatarPath}`;
    }
    
    // 3. Fallback for relative paths
    return `http://127.0.0.1:8000/media/${avatarPath}`;
  };

  // --- HELPER: Get Initials ---
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // --- 1. FETCH FILTER OPTIONS (Projects & Roles) ---
  useEffect(() => {
    const headers = getAuthHeaders();

    // A. Fetch Projects
    fetch('http://127.0.0.1:8000/api/projects/', { headers })
      .then(res => res.json())
      .then(data => setProjectList(data))
      .catch(err => console.error("Error fetching projects:", err));

    // B. Fetch Employees to get Designations (Roles) dynamically
    fetch('http://127.0.0.1:8000/api/employees/', { headers })
        .then(res => res.json())
        .then(data => {
            // Extract unique designations
            const uniqueDesignations = [...new Set(data.map(emp => emp.designation).filter(Boolean))];
            setRoleList(['All Roles', ...uniqueDesignations]);
        })
        .catch(err => console.error("Error fetching roles:", err));

  }, []);

  // --- 2. FETCH TEAM UPDATES (Main Logic) ---
  useEffect(() => {
    fetchUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedProject, selectedRole, dateFilter, customDate]);

  const fetchUpdates = () => {
    setLoading(true);

    // Calculate the 'date' param based on dropdown
    let queryDate = new Date().toISOString().split('T')[0]; // Default Today
    
    if (dateFilter === 'Yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        queryDate = d.toISOString().split('T')[0];
    } else if (dateFilter === 'Custom') {
        queryDate = customDate;
    }

    // Build URL Params
    const params = new URLSearchParams({
        date: queryDate,
        search: searchTerm,
        project: selectedProject,
        role: selectedRole
    });

    // Call your Django API
    fetch(`http://127.0.0.1:8000/api/team-updates/?${params.toString()}`, {
        headers: getAuthHeaders()
    })
      .then(res => {
          if (res.status === 401) {
              console.error("Unauthorized: Please login again");
              return [];
          }
          return res.json();
      })
      .then(data => {
          if (Array.isArray(data)) {
            setEmployees(data);
          } else {
            setEmployees([]);
          }
          setLoading(false);
      })
      .catch(err => {
          console.error("Error fetching updates:", err);
          setLoading(false);
      });
  };

  return (
    <div className="team-updates-container">
      {/* HEADER */}
      <div className="updates-header">
        <h2>Team Updates</h2>
        <p>See daily work updates from teammates working on the same project.</p>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        {/* Search */}
        <div className="search-wrapper">
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search team member" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Project Dropdown */}
        <select 
            className="filter-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="All Projects">All Projects</option>
          {projectList.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        {/* Role Dropdown (DYNAMIC) */}
        <select 
            className="filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
        >
          {roleList.map((role, index) => (
            <option key={index} value={role}>{role}</option>
          ))}
        </select>

        {/* Date Dropdown */}
        <div style={{ display: 'flex', gap: '8px' }}>
            <select 
                className="filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
            >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Custom">Custom Date</option>
            </select>
            
            {dateFilter === 'Custom' && (
                <input 
                    type="date" 
                    className="filter-select"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                />
            )}
        </div>
      </div>

      {/* --- GRID CONTENT --- */}
      {loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#6B7280'}}>Loading updates...</div>
      ) : (
        <div className="updates-grid">
            {employees.length > 0 ? (
            employees.map(emp => (
                <EmployeeCard 
                    key={emp.id} 
                    emp={emp} 
                    getImageUrl={getImageUrl}
                    getInitials={getInitials} // Pass helper
                />
            ))
            ) : (
            <div className="no-results">
                <div style={{fontSize: '48px', marginBottom: '10px'}}>📄</div> 
                <h3>No results found!</h3>
                <p>Try again with a different keyword or filter.</p>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Employee Card ---
const EmployeeCard = ({ emp, getImageUrl, getInitials }) => {
    const avatarUrl = getImageUrl(emp.avatar);

    return (
        <div className="employee-card">
            {/* Header */}
            <div className="card-header">
                {/* UPDATED: Logic for Avatar vs Initials */}
                <div className="avatar-wrapper">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt={emp.full_name} 
                            className="avatar" 
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '1px solid #E5E7EB'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#E0E7FF', // Light Indigo
                            color: '#4F46E5', // Indigo Text
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            border: '1px solid #E5E7EB'
                        }}>
                            {getInitials(emp.full_name)}
                        </div>
                    )}
                </div>

                <div className="emp-info">
                    <h4>{emp.full_name}</h4>
                    <span>{emp.designation}</span>
                </div>
            </div>

            {/* Today */}
            <div>
                <div className="card-section-title">TODAY</div>
                {emp.tasks.today.length > 0 ? (
                    emp.tasks.today.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))
                ) : ( <div className="update-item" style={{color:'#9CA3AF'}}>No tasks posted.</div> )}
            </div>

            {/* Yesterday */}
            <div>
                <div className="card-section-title">YESTERDAY</div>
                {emp.tasks.yesterday.length > 0 ? (
                    emp.tasks.yesterday.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))
                ) : ( <div className="update-item" style={{color:'#9CA3AF'}}>No tasks posted.</div> )}
            </div>

            {/* Blockers */}
            {emp.tasks.blockers.length > 0 && (
                <div>
                   <div className="card-section-title" style={{color:'#EF4444'}}>BLOCKERS</div>
                   <div className="blocker-box">
                      {emp.tasks.blockers.map(task => (
                          <TaskItem key={task.id} task={task} isBlocker={true} />
                      ))}
                   </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: Single Task Item ---
const TaskItem = ({ task, isBlocker }) => (
    <div className={`update-item ${isBlocker ? 'blocker-text' : ''}`}>
        <div style={{minWidth: 'fit-content'}}>
            {/* Safety check: ensure project_details exists */}
            <span 
                className="mini-tag" 
                style={{ backgroundColor: task.project_details?.color_code || '#9CA3AF' }}
            >
                {task.project_details?.name || 'No Project'}
            </span>
        </div>
        <span>{task.content}</span>
    </div>
);

export default TeamUpdates;