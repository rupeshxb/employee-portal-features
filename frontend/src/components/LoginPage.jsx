import React, { useState, useContext } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext'; // <-- Import Context

const Login = () => { // <-- Removed setToken prop
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { loginUser } = useContext(UserContext); // <-- Use the new function

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login Successful:", data);

                // 1. Let the Context handle storage and state updates IMMEDIATELY
                const userData = {
                    username: data.username,
                    is_manager: data.is_manager,
                    role: data.role,
                    avatar: data.avatar,
                    first_name: data.first_name,
                    designation: data.designation
                };

                loginUser(userData, data.token);

                // 2. Route the user based on their role
                if (data.role === 'Manager' || data.is_manager || data.designation === 'Admin') {
                    navigate('/manager/dashboard');
                } else {
                    navigate('/employee/dashboard');
                }

            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            console.error(err);
            setError('Server unavailable. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background decorative shapes */}
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>

            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <LogIn size={28} color="white" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Enter your credentials to access the portal.</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && <div className="error-banner">{error}</div>}

                    {/* Username Input */}
                    <div className="input-group">
                        <label>Username</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="text"
                                name="username"
                                placeholder="e.g. john.doe"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="forgot-password">
                            <a href="#">Forgot password?</a>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span className="loader"></span>
                        ) : (
                            <>
                                Sign In <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2024 Employee Portal. Secure Access.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;