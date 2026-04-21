import axiosInstance from './axiosInstance';

export const fetchDesignations = async () => {
    const response = await axiosInstance.get('/api/designations/');
    return response.data;
};

export const createDesignation = async (data) => {
    const response = await axiosInstance.post('/api/designations/', data);
    return response.data;
};

export const updateDesignation = async (id, data) => {
    const response = await axiosInstance.put(`/api/designations/${id}/`, data);
    return response.data;
};

export const deleteDesignation = async (id) => {
    const response = await axiosInstance.delete(`/api/designations/${id}/`);
    return response.data;
};
