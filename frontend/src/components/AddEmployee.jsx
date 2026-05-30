import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../style/AddEmployee.css";
import { API_BASE_URL } from "../../config";
import { CalendarInputIcon, BackArrowIcon, PasswordEyeIcon, PasswordEyeOffIcon, CopyIcon, RadioSelectedIcon, RadioUnselectedIcon } from "./Icons";
import CountryCodeSelect from "./CountryCodeSelect";
import CustomDatePicker from "./CustomDatePicker";
import CustomSelect from "./CustomSelect";
import { getDialCode } from "../data/countryCodes";

const AddEmployee = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const designationRef = useRef(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    joined_date: "",
    pan_number: "",
    official_email: "",
    personal_email: "",
    phone_number: "",
    emergency_contact: "",
    employment_type: "Full-Time",
    status: "Active",
    department: "",
    designation: "",
    reporting_manager: "",
  });

  const [phoneCountry, setPhoneCountry] = useState("NP");
  const [emergencyCountry, setEmergencyCountry] = useState("NP");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);
  const formCardRef = useRef(null);

  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationSearch, setDesignationSearch] = useState("");
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (designationRef.current && !designationRef.current.contains(e.target)) {
        setShowDesignationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };
        const [mgrRes, deptRes, desigRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/manager/managers-list/`, { headers }),
          fetch(`${API_BASE_URL}/api/departments/`, { headers }),
          fetch(`${API_BASE_URL}/api/designations/`, { headers }),
        ]);
        if (mgrRes.ok) {
          const d = await mgrRes.json();
          setManagers(d.results || d);
        }
        if (deptRes.ok) {
          const d = await deptRes.json();
          setDepartments(d.results || d);
        }
        if (desigRes.ok) {
          const d = await desigRes.json();
          const all = d.results || d;
          setDesignations(all.filter((x) => x.status === "Active"));
        }
      } catch {
        // silently fail — dropdowns will be empty
      }
    };
    fetchDropdownData();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const copyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const newFieldErrors = {};
    if (!formData.employee_id.trim()) newFieldErrors.employee_id = 'Employee ID is required.';
    if (!formData.username.trim()) newFieldErrors.username = 'Username is required.';
    if (!formData.password.trim()) newFieldErrors.password = 'Password is required.';
    if (!formData.first_name.trim()) newFieldErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) newFieldErrors.last_name = 'Last name is required.';
    if (!formData.joined_date) newFieldErrors.joined_date = 'Joined date is required.';
    if (!formData.official_email.trim()) newFieldErrors.official_email = 'Official email is required.';
    if (!formData.phone_number.trim()) newFieldErrors.phone_number = 'Phone number is required.';
    if (!formData.department) newFieldErrors.department = 'Department is required.';
    if (!formData.designation) newFieldErrors.designation = 'Please select a designation from the list.';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const payload = {
      ...formData,
      phone_number: formData.phone_number ? getDialCode(phoneCountry) + formData.phone_number : "",
      emergency_contact: formData.emergency_contact ? getDialCode(emergencyCountry) + formData.emergency_contact : "",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/manager/employee-overview/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate("/manager/employee-overview", { state: { toastMessage: 'Employee added successfully!' } });
      } else {
        const errData = await res.json();
        let errorMsg = "Failed to add employee. Please check the inputs.";
        if (errData.detail) errorMsg = errData.detail;
        else if (typeof errData === "object")
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        setError(errorMsg);
      }
    } catch {
      setError("Network error occurred while adding employee.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDesignationName = designations.find(d => d.id === formData.designation)?.name;
  const filteredDesignations = (selectedDesignationName && designationSearch === selectedDesignationName)
    ? designations
    : designations.filter((d) => d.name.toLowerCase().includes(designationSearch.toLowerCase()));

  return (
    <div className="add-employee-container">
      {/* Back Navigation */}
      <div className="back-nav">
        <button type="button" className="back-circle-btn" onClick={() => navigate("/manager/employee-overview")}>
          <BackArrowIcon />
        </button>
        <span className="back-nav-static">Back to </span>
        <button type="button" className="back-text-link" onClick={() => navigate("/manager/employee-overview")}>
          Employee Overview
        </button>
      </div>

      {/* Page Heading */}
      <div className="add-employee-info">
        <h2>Add New Employee</h2>
        <p>Register a new team member with all relevant personal and job information.</p>
      </div>

      {/* Form Card */}
      <div className="add-employee-page" ref={formCardRef}>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="add-employee-form">

          {/* 1. Account / Login Details */}
          <div className="form-section login-details">
            <h3>Account / Login Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Employee ID *</label>
                <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="e.g. EMP-001" className={fieldErrors.employee_id ? 'input-error' : ''} />
                {fieldErrors.employee_id && <span className="field-error">{fieldErrors.employee_id}</span>}
              </div>
              <div className="input-group">
                <label>Username *</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" className={fieldErrors.username ? 'input-error' : ''} />
                {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
              </div>
              <div className="input-group">
                <label>Generate Password *</label>
                <div className="pwd-row">
                  <div className="password-input-wrapper">
                    <input
                      type="text"
                      name="password"
                      value={showPassword ? formData.password : '*'.repeat(32)}
                      onChange={(e) => {
                        if (!showPassword) return;
                        setFormData((prev) => ({ ...prev, password: e.target.value }));
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder=""
                      className={[!showPassword ? 'pwd-masked' : '', fieldErrors.password ? 'input-error' : ''].filter(Boolean).join(' ')}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pwd-icon-btn" onClick={() => setShowPassword((v) => !v)} title={showPassword ? "Hide" : "Show"}>
                      {showPassword ? <PasswordEyeOffIcon /> : <PasswordEyeIcon />}
                    </button>
                    <span className="pwd-divider" />
                    <button type="button" className="pwd-icon-btn" onClick={copyPassword} title={copied ? "Copied!" : "Copy"}>
                      <CopyIcon />
                    </button>
                  </div>
                  <button type="button" onClick={generatePassword} className="btn-generate">
                    Generate
                  </button>
                </div>
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>
            </div>
          </div>

          {/* 2. Personal Details */}
          <div className="form-section">
            <h3>Personal Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Employee first name" className={fieldErrors.first_name ? 'input-error' : ''} />
                {fieldErrors.first_name && <span className="field-error">{fieldErrors.first_name}</span>}
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Employee last name" className={fieldErrors.last_name ? 'input-error' : ''} />
                {fieldErrors.last_name && <span className="field-error">{fieldErrors.last_name}</span>}
              </div>
              <div className="input-group">
                <label>Joined Date *</label>
                <div
                  className={`date-input-wrapper${fieldErrors.joined_date ? ' input-error' : ''}`}
                  ref={datePickerRef}
                  onClick={() => setDatePickerOpen(v => !v)}
                >
                  <span className={`date-display${!formData.joined_date ? ' placeholder' : ''}`}>
                    {formData.joined_date ? formatDateDisplay(formData.joined_date) : 'Select joining date'}
                  </span>
                  <CalendarInputIcon className="date-input-icon" />
                  <CustomDatePicker
                    value={formData.joined_date}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, joined_date: val }));
                      if (fieldErrors.joined_date) setFieldErrors(prev => ({ ...prev, joined_date: '' }));
                    }}
                    isOpen={datePickerOpen}
                    onClose={() => setDatePickerOpen(false)}
                    ignoreRef={datePickerRef}
                    portal={true}
                    boundaryRef={formCardRef}
                  />
                </div>
                {fieldErrors.joined_date && <span className="field-error">{fieldErrors.joined_date}</span>}
              </div>
              <div className="input-group">
                <label>PAN Number</label>
                <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="Enter PAN number" />
              </div>
            </div>
          </div>

          {/* 3. Contact Details */}
          <div className="form-section">
            <h3>Contact Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Official Email *</label>
                <input type="email" name="official_email" value={formData.official_email} onChange={handleChange} placeholder="Employee official email" className={fieldErrors.official_email ? 'input-error' : ''} />
                {fieldErrors.official_email && <span className="field-error">{fieldErrors.official_email}</span>}
              </div>
              <div className="input-group">
                <label>Personal Email</label>
                <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} placeholder="Employee personal email" />
              </div>
              <div className="input-group">
                <label>Phone Number *</label>
                <div className={`phone-input-wrapper ${fieldErrors.phone_number ? 'input-error' : ''}`}>
                  <CountryCodeSelect value={phoneCountry} onChange={setPhoneCountry} />
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone number" className="phone-number-input" />
                </div>
                {fieldErrors.phone_number && <span className="field-error">{fieldErrors.phone_number}</span>}
              </div>
              <div className="input-group">
                <label>Emergency Contact Number</label>
                <div className="phone-input-wrapper">
                  <CountryCodeSelect value={emergencyCountry} onChange={setEmergencyCountry} />
                  <input type="tel" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Phone number" className="phone-number-input" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Employment Details */}
          <div className="form-section">
            <h3>Employment Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Employment Type *</label>
                <CustomSelect
                  value={formData.employment_type}
                  onChange={(v) => setFormData(p => ({ ...p, employment_type: v }))}
                  options={[
                    { value: 'Full-Time', label: 'Full-Time' },
                    { value: 'Part-Time', label: 'Part-Time' },
                    { value: 'Contract', label: 'Contract' },
                    { value: 'Internship', label: 'Internship' },
                  ]}
                  placeholder="Select employment type"
                />
              </div>

              <div className="input-group">
                <label>Status *</label>
                <div className="ae-radio-group">
                  <label className="ae-radio-label" onClick={() => setFormData(p => ({ ...p, status: "Active" }))}>
                    {formData.status === "Active" ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                    <span className={`ae-radio-text${formData.status === "Active" ? " ae-radio-text--active" : ""}`}>Active</span>
                  </label>
                  <label className="ae-radio-label" onClick={() => setFormData(p => ({ ...p, status: "Inactive" }))}>
                    {formData.status === "Inactive" ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                    <span className={`ae-radio-text${formData.status === "Inactive" ? " ae-radio-text--active" : ""}`}>Inactive</span>
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label>Department *</label>
                <CustomSelect
                  value={formData.department}
                  onChange={(v) => { setFormData(p => ({ ...p, department: v })); if (fieldErrors.department) setFieldErrors(p => ({ ...p, department: '' })); }}
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Select Department"
                  searchable
                  searchPlaceholder="Search department..."
                  hasError={!!fieldErrors.department}
                />
                {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
              </div>

              <div className="input-group" ref={designationRef}>
                <label>Designation *</label>
                <div className="designation-combobox">
                  <input
                    type="text"
                    placeholder="Search designation..."
                    value={designationSearch}
                    className={fieldErrors.designation ? 'input-error' : ''}
                    onChange={(e) => {
                      setDesignationSearch(e.target.value);
                      setFormData((prev) => ({ ...prev, designation: "" }));
                      setShowDesignationDropdown(true);
                      if (fieldErrors.designation) setFieldErrors(p => ({ ...p, designation: '' }));
                    }}
                    onFocus={() => setShowDesignationDropdown(true)}
                    autoComplete="off"
                  />
                  {showDesignationDropdown && (
                    <ul className="designation-dropdown-list">
                      {filteredDesignations.map((d) => (
                        <li key={d.id} className="designation-dropdown-item"
                          onMouseDown={() => {
                            setFormData((prev) => ({ ...prev, designation: d.id }));
                            setDesignationSearch(d.name);
                            setShowDesignationDropdown(false);
                            setFieldErrors(p => ({ ...p, designation: '' }));
                          }}>
                          {d.name}
                        </li>
                      ))}
                      {filteredDesignations.length === 0 && (
                        <li className="designation-no-results">No designations found</li>
                      )}
                    </ul>
                  )}
                </div>
                {fieldErrors.designation && <span className="field-error">{fieldErrors.designation}</span>}
              </div>

              <div className="input-group">
                <label>Reporting Manager</label>
                <CustomSelect
                  value={formData.reporting_manager}
                  onChange={(v) => setFormData(p => ({ ...p, reporting_manager: v }))}
                  options={managers.map(m => ({ value: m.id, label: m.full_name || m.username }))}
                  placeholder="Select Manager"
                  searchable
                  searchPlaceholder="Search manager..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/manager/employee-overview")}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
