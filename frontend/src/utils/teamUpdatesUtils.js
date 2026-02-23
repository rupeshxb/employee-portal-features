import { API_BASE_URL } from '../../config';

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    };
};

export const getImageUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    if (avatarPath.startsWith('/media')) {
        return `${API_BASE_URL}${avatarPath}`;
    }
    return `${API_BASE_URL}/media/${avatarPath}`;
};

export const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};