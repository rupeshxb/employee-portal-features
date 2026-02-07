// src/utils/helpers.js

// --- COLOR VISIBILITY HELPER ---
export const getSafeBackgroundColor = (hex) => {
  if (!hex || typeof hex !== 'string' || hex.length < 4) return '#4B5563';
  try {
    const cleanHex = hex.trim().replace('#', '');
    const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
    let r = parseInt(fullHex.substring(0, 2), 16);
    let g = parseInt(fullHex.substring(2, 4), 16);
    let b = parseInt(fullHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#4B5563';
    
    // Calculate Luma (Brightness)
    const luma = (0.299 * r + 0.587 * g + 0.114 * b);
    if (luma > 180) return '#B45309'; // Force dark amber for light colors
    
    return `#${fullHex}`;
  } catch (e) { return '#4B5563'; }
};

// --- TIME HELPER ---
export const getLatestTime = (taskList) => {
  if (!taskList || taskList.length === 0) return "09:00 AM";
  const latest = taskList.reduce((latestStr, task) => {
    const currentStr = task.updated_at || task.created_at;
    return new Date(currentStr) > new Date(latestStr) ? currentStr : latestStr;
  }, taskList[0].updated_at || taskList[0].created_at);

  return new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};