import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getLatestTime } from '../utils/helpers';
import TaskList from './TaskList';
import TaskModal from './TaskModal';
import DeleteModal from './DeleteModal';
import NotificationToast from './NotificationToast';
import { API_BASE_URL } from '../../config';
import '../style/AddTask.css';

const EmptyStateIllustration = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M41.45 31.45C39.35 31.45 37.7 29.75 37.7 27.7V13.75C37.7 11.7 39.35 10 41.45 10C43.55 10 45.2 11.7 45.2 13.75V27.65C45.2 29.75 43.55 31.45 41.45 31.45Z" fill="#C6C7CF" />
        <path d="M78.55 31.45C76.45 31.45 74.8 29.75 74.8 27.7V13.75C74.8 11.65 76.5 10 78.55 10C80.65 10 82.3 11.7 82.3 13.75V27.65C82.3 29.75 80.65 31.45 78.55 31.45Z" fill="#C6C7CF" />
        <path d="M107.5 79.0999C107.5 79.8499 107.25 80.5999 106.6 81.2499C99.35 88.5499 86.45 101.55 79.05 109C78.4 109.7 77.55 110 76.7 110C75.05 110 73.45 108.7 73.45 106.8V89.2999C73.45 81.9999 79.65 75.9499 87.25 75.9499C92 75.8999 98.6 75.8999 104.25 75.8999C106.2 75.8999 107.5 77.4499 107.5 79.0999Z" fill="white" />
        <path d="M107.5 79.0999C107.5 79.8499 107.25 80.5999 106.6 81.2499C99.35 88.5499 86.45 101.55 79.05 109C78.4 109.7 77.55 110 76.7 110C75.05 110 73.45 108.7 73.45 106.8V89.2999C73.45 81.9999 79.65 75.9499 87.25 75.9499C92 75.8999 98.6 75.8999 104.25 75.8999C106.2 75.8999 107.5 77.4499 107.5 79.0999Z" fill="#DADBE3" />
        <path d="M97.85 22.5C94.55 20.05 89.8 22.4 89.8 26.55V27.05C89.8 32.9 85.6 38.3 79.75 38.9C73 39.6 67.3 34.3 67.3 27.7V22.5C67.3 19.75 65.05 17.5 62.3 17.5H57.7C54.95 17.5 52.7 19.75 52.7 22.5V27.05C52.7 31.45 50.35 35.55 46.7 37.55C46.5 37.7 46.3 37.8 46.1 37.9C46.05 37.9 46.05 37.95 46 37.95C45.65 38.1 45.3 38.25 44.9 38.4C44.8 38.45 44.7 38.45 44.6 38.5C44 38.7 43.35 38.85 42.65 38.9H42.6C41.85 39 41.05 39 40.3 38.9H40.25C39.55 38.85 38.9 38.7 38.3 38.5C37.8 38.35 37.3 38.15 36.8 37.9C32.9 36.15 30.2 32.25 30.2 27.7V26.55C30.2 22.7 26.1 20.4 22.85 22.05C22.8 22.1 22.75 22.1 22.7 22.15H22.65C22.3 22.4 22 22.65 21.65 22.9C21.1 23.35 20.55 23.8 20.05 24.3C19.7 24.65 19.35 25 19.05 25.35C18.65 25.75 18.3 26.15 17.95 26.6C17.7 26.9 17.4 27.2 17.2 27.55C16.95 27.85 16.75 28.2 16.55 28.5C16.5 28.55 16.45 28.6 16.4 28.7C15.95 29.35 15.55 30.1 15.2 30.8C15.1 30.9 15.05 30.95 15.05 31.05C14.75 31.65 14.45 32.25 14.25 32.9C14.1 33.15 14.05 33.35 13.95 33.6C13.85 33.8 13.8 34.05 13.7 34.25C13.55 34.75 13.4 35.3 13.25 35.85C13.05 36.55 12.9 37.3 12.8 38.05C12.7 38.6 12.65 39.15 12.6 39.75C12.55 40.45 12.5 41.15 12.5 41.85V85.65C12.5 99.1 23.4 110 36.85 110H60.95C63.7 110 65.95 107.75 65.95 105V89.3C65.95 77.8 75.5 68.45 87.25 68.45C89.9 68.4 96.35 68.4 102.5 68.4C105.25 68.4 107.5 66.15 107.5 63.4V41.85C107.5 33.9 103.7 26.95 97.85 22.5ZM55.65 79.55C55.2 81.05 53.8 82.1 52.15 82.1H33.95C33.7 82.1 33.5 82.1 33.3 82C31.5 81.75 30.2 80.2 30.2 78.35C30.2 76.25 31.85 74.55 33.95 74.55H52.15C54.2 74.55 55.9 76.25 55.9 78.35C55.9 78.75 55.85 79.2 55.65 79.55ZM69.55 61C69.1 62.5 67.7 63.55 66.05 63.55H33.95C33.7 63.55 33.5 63.55 33.3 63.45C31.5 63.2 30.2 61.65 30.2 59.8C30.2 57.7 31.85 56 33.95 56H66.05C68.15 56 69.8 57.7 69.8 59.8C69.8 60.2 69.75 60.65 69.55 61Z" fill="#DADBE3" />
    </svg>
);

const AddTask = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [modalState, setModalState] = useState({ show: false, isEditing: false, task: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, task: null });
    const [notification, setNotification] = useState({ show: false, message: '' });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        return token ? { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` } : {};
    };

    useEffect(() => {
        fetchProjects();
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        fetch(`${API_BASE_URL}/api/tasks/`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => setTasks(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
            .catch(err => console.error(err));
    };

    const fetchProjects = () => {
        fetch(`${API_BASE_URL}/api/projects/`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(err => console.error("Error loading projects", err));
    };

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
                    
                    // --- NEW LOGIC HERE ---
                    // Announce globally that a task was added/edited so TeamUpdates can refresh!
                    window.dispatchEvent(new Event('taskAdded'));

                    const msg = modalState.isEditing ? "Task updated!" : "Daily task for today added successfully.";
                    showNotification(msg);
                }
            });
    };

    const showNotification = (msg) => {
        setNotification({ show: true, message: msg });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    };
    
    const groupedTasks = (() => {
        const groups = {};
        tasks.forEach(task => {
            const rawDate = task.date || task.created_at;
            const dateKey = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
            if (!groups[dateKey]) groups[dateKey] = { date: dateKey, tasks: [], blockers: [], allTasks: [] };
            groups[dateKey].allTasks.push(task);
            task.is_blocker ? groups[dateKey].blockers.push(task) : groups[dateKey].tasks.push(task);
        });
        return Object.values(groups).map(group => ({
            ...group,
            lastUpdated: getLatestTime(group.allTasks)
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
    })();

    return (
        <div className="content-area">
            <DeleteModal
                show={deleteModal.show}
                task={deleteModal.task}
                onClose={() => setDeleteModal({ show: false, task: null })}
                onConfirm={() => {
                    fetch(`${API_BASE_URL}/api/tasks/${deleteModal.task.id}/`, {
                        method: 'DELETE', headers: getAuthHeaders()
                    }).then(() => { 
                        fetchTasks(); 
                        setDeleteModal({ show: false, task: null }); 
                        // Trigger a refresh on delete too!
                        window.dispatchEvent(new Event('taskAdded'));
                    });
                }}
            />

            {/* Added relative-banner-context class to lock positioning */}
            <div className="hero-banner relative-banner-context">

                {/* 1. NOTIFICATION LAYER (Renamed wrapper to avoid global conflicts) */}
                <div className="banner-notification-wrapper">
                    <NotificationToast
                        show={notification.show}
                        message={notification.message}
                        onClose={() => setNotification({ show: false, message: '' })}
                    />
                </div>

                {/* 2. DECORATION LAYER */}
                <div className="hero-decor" aria-hidden="true">
                    <div className="hero-circle hero-circle-1" />
                    <div className="hero-circle hero-circle-2" />
                    <div className="hero-circle hero-circle-3" />
                </div>

                {/* 3. CONTENT LAYER */}
                <div className="hero-title">
                    <h1>Add Daily Tasks</h1>
                    <p>Add a brief summary of today’s work, meetings, and any blockers.</p>
                </div>

                <button
                    className="hero-btn"
                    onClick={() => setModalState({ show: true, isEditing: false, task: null })}
                >
                    <Plus size={18} /> Add New Task
                </button>
            </div>

            {tasks.length === 0 ? (
                <div className="empty-state-container">
                    <div className="empty-icon-wrapper"><EmptyStateIllustration /></div>
                    <h3 className="empty-title">No tasks added yet!</h3>
                    <p className="empty-subtitle">All of your tasks once added will be shown here.</p>
                    <button className="btn-primary-large" onClick={() => setModalState({ show: true, isEditing: false, task: null })}>
                        <Plus size={20} /> Add New Task
                    </button>
                </div>
            ) : (
                <TaskList
                    groupedTasks={groupedTasks}
                    onEdit={(task) => setModalState({ show: true, isEditing: true, task })}
                    onDelete={(task) => setDeleteModal({ show: true, task })}
                    onAddNewTask={() => setModalState({ show: true, isEditing: false, task: null })}
                />
            )}

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