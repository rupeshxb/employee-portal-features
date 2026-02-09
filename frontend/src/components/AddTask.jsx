import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getLatestTime } from '../utils/helpers';
import TaskList from './TaskList';
import TaskModal from './TaskModal';
import DeleteModal from './DeleteModal';
import NotificationToast from './NotificationToast';
import { API_BASE_URL } from '../../config';

const AddTask = () => {
    // --- STATE ---
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // UI State
    const [modalState, setModalState] = useState({ show: false, isEditing: false, task: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, task: null });
    const [notification, setNotification] = useState({ show: false, message: '' });

    // --- HELPER: Get Token Safely (FIXED) ---
    const getAuthHeaders = () => {
        // 1. Check both common storage keys
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        
        if (!token) {
            console.error("❌ NO TOKEN FOUND. Please log in.");
            return {}; 
        }

        return {
            'Content-Type': 'application/json',
            // Try 'Token' first (Standard Django). If that fails, change 'Token' to 'Bearer' (JWT).
            'Authorization': `Token ${token}` 
        };
    };

    // --- API CALLS ---
    useEffect(() => {
        fetchProjects();
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        fetch(`${API_BASE_URL}/api/tasks/`, {
            headers: getAuthHeaders()
        })
        .then(res => {
            if (res.status === 401 || res.status === 403) {
                console.error("Auth failed - check console for token type");
            }
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        })
        .then(data => setTasks(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
        .catch(err => console.error(err));
    };

    const fetchProjects = () => {
        fetch(`${API_BASE_URL}/api/projects/`, {
            headers: getAuthHeaders()
        })
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(err => console.error("Error loading projects", err));
    };

    // --- LOGIC ---
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

    const handleTaskSubmit = (formData) => {
        const url = modalState.isEditing 
            ? `${API_BASE_URL}/api/tasks/${modalState.task.id}/` 
            : `${API_BASE_URL}/api/tasks/`;
        
        const method = modalState.isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        })
        .then(async response => {
            if (response.ok) {
                setModalState({ show: false, isEditing: false, task: null });
                fetchTasks();
                showNotification(modalState.isEditing ? "Task updated!" : "Daily task added!");
            } else {
                const err = await response.json();
                alert("Error saving task: " + JSON.stringify(err));
            }
        });
    };

    const confirmDelete = () => {
        fetch(`${API_BASE_URL}/api/tasks/${deleteModal.task.id}/`, { 
            method: 'DELETE',
            headers: getAuthHeaders() 
        })
        .then(res => { 
            if(res.ok) {
                fetchTasks();
                setDeleteModal({ show: false, task: null });
                showNotification("Task deleted.");
            }
        });
    };

    const showNotification = (msg) => {
        setNotification({ show: true, message: msg });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    };

    return (
        <div className="content-area">
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

            {/* HERO BANNER */}
            <div className="hero-banner">
                <div className="hero-title">
                    <h1>Daily Tasks</h1>
                    <p>Track your work, manage hours, and update the team.</p>
                </div>
                <button className="hero-btn" onClick={() => setModalState({ show: true, isEditing: false, task: null })}>
                    <Plus size={18} /> Add Task
                </button>
            </div>

            <TaskList 
                groupedTasks={groupedTasks} 
                onEdit={(task) => setModalState({ show: true, isEditing: true, task: task })}
                onDelete={(task) => setDeleteModal({ show: true, task: task })}
            />

            <TaskModal 
                show={modalState.show}
                onClose={() => setModalState({ show: false, isEditing: false, task: null })}
                onSubmit={handleTaskSubmit}
                isEditing={modalState.isEditing}
                initialData={modalState.task}
                projects={projects}
            />
        </div>
    );
};

export default AddTask;