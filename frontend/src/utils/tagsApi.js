import axiosInstance from './axiosInstance'; // Adjust the import path if needed

// --- DESIGNATIONS ---
// Fetch all designations for the multiselect dropdown in the modal
export const fetchDesignations = async () => {
    const response = await axiosInstance.get('/api/designations/');
    return response.data;
};

// --- TAGS ---
// Fetch all tags for the main table
export const fetchTags = async () => {
    const response = await axiosInstance.get('/api/tags/');
    return response.data;
};

// Create a new tag (POST)
export const createTag = async (tagData) => {
    // tagData expects: { name: "...", color: "...", designations: [id1, id2] }
    const response = await axiosInstance.post('/api/tags/', tagData);
    return response.data;
};

// Update an existing tag (PUT)
export const updateTag = async (tagId, tagData) => {
    const response = await axiosInstance.put(`/api/tags/${tagId}/`, tagData);
    return response.data;
};

// Delete a tag (DELETE)
export const deleteTag = async (tagId) => {
    const response = await axiosInstance.delete(`/api/tags/${tagId}/`);
    return response.data;
};