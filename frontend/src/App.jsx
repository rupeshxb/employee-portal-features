import { useState, useEffect } from 'react'
import './App.css'

// Import Helper Logic
import { getLatestTime } from './utils/helpers'

// Import Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TaskList from './components/TaskList'
import TaskModal from './components/TaskModal'
import DeleteModal from './components/DeleteModal'
import NotificationToast from './components/NotificationToast'

function App() {
  // --- STATE ---
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  
  // UI State
  const [modalState, setModalState] = useState({ show: false, isEditing: false, task: null })
  const [deleteModal, setDeleteModal] = useState({ show: false, task: null })
  const [notification, setNotification] = useState({ show: false, message: '' })

  const EMPLOYEE_ID = 2; 

  // --- API CALLS ---
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [])

  const fetchTasks = () => {
    fetch('http://127.0.0.1:8000/api/tasks/')
      .then(res => res.json())
      .then(data => setTasks(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
      .catch(err => console.error(err));
  }

  const fetchProjects = () => {
    fetch('http://127.0.0.1:8000/api/projects/')
      .then(res => res.json())
      .then(data => setProjects(data));
  }

  // --- HANDLERS ---
  
  // 1. Grouping Logic
  const groupedTasks = (() => {
    const groups = {};
    tasks.forEach(task => {
      const rawDate = task.date || task.created_at;
      const dateKey = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, tasks: [], blockers: [], allTasks: [] };
      }
      groups[dateKey].allTasks.push(task);
      task.is_blocker ? groups[dateKey].blockers.push(task) : groups[dateKey].tasks.push(task);
    });
    
    return Object.values(groups).map(group => ({
      ...group,
      lastUpdated: getLatestTime(group.allTasks)
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  // 2. Form Submit (Create or Update)
  const handleTaskSubmit = (formData) => {
    const payload = { ...formData, employee_id: EMPLOYEE_ID };
    const url = modalState.isEditing 
      ? `http://127.0.0.1:8000/api/tasks/${modalState.task.id}/` 
      : 'http://127.0.0.1:8000/api/tasks/';
    const method = modalState.isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      if (response.ok) {
        setModalState({ show: false, isEditing: false, task: null });
        fetchTasks();
        showNotification(modalState.isEditing ? "Task updated!" : "Daily task added!");
      } else {
        alert("Error saving task");
      }
    });
  }

  // 3. Delete Task
  const confirmDelete = () => {
    fetch(`http://127.0.0.1:8000/api/tasks/${deleteModal.task.id}/`, { method: 'DELETE' })
      .then(res => { 
        if(res.ok) {
          fetchTasks();
          setDeleteModal({ show: false, task: null });
          showNotification("Task deleted.");
        }
      });
  }

  // Helper to show toast
  const showNotification = (msg) => {
    setNotification({ show: true, message: msg });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  }

  // --- RENDER ---
  return (
    <div className="app-container">
      <NotificationToast 
        show={notification.show} 
        message={notification.message} 
        onClose={() => setNotification({ show: false, message: '' })} 
      />

      <DeleteModal 
        show={deleteModal.show} 
        task={deleteModal.task} 
        onClose={() => setDeleteModal({ show: false, task: null })} 
        onConfirm={confirmDelete}
      />

      <Sidebar />

      <main className="main-content">
        <Header />
        
        <div className="content-area">
          <div className="hero-banner">
            <div className="hero-title">
              <h1>Add Daily Tasks</h1>
              <p>Add a brief summary of today's work, meetings, and any blockers.</p>
            </div>
            <button className="hero-btn" onClick={() => setModalState({ show: true, isEditing: false, task: null })}>
              + Add New Task
            </button>
          </div>

          <TaskList 
            groupedTasks={groupedTasks} 
            onEdit={(task) => setModalState({ show: true, isEditing: true, task: task })}
            onDelete={(task) => setDeleteModal({ show: true, task: task })}
          />
        </div>
      </main>

      {/* ADD/EDIT FORM MODAL */}
      <TaskModal 
        show={modalState.show}
        onClose={() => setModalState({ show: false, isEditing: false, task: null })}
        onSubmit={handleTaskSubmit}
        isEditing={modalState.isEditing}
        initialData={modalState.task}
        projects={projects}
      />
    </div>
  )
}

export default App