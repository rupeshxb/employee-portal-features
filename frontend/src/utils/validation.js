/**
 * Logic for individual field validation
 */
export const validateCurrentPassword = (value) => {
    if (!value) return "Current password is required.";
    return "";
};

/**
 * Evaluates password strength
 * @returns {Object} { label: string, color: string, score: number }
 */
export const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "", score: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special char bonus

    if (score <= 1) return { label: "Weak", color: "#ef4444", score }; // Red
    if (score === 2) return { label: "Medium", color: "#f97316", score }; // Orange
    return { label: "Strong", color: "#22c55e", score }; // Green
};

export const validatePasswordForm = (passwords) => {
    const { old, new: newPass, confirm } = passwords;

    if (!old) return { isValid: false, error: "Current password is required." };

    const strength = getPasswordStrength(newPass);
    if (strength.score < 2) {
        return { isValid: false, error: "Password is too weak." };
    }

    if (newPass !== confirm) {
        return { isValid: false, error: "New passwords do not match." };
    }

    return { isValid: true, error: "" };
};