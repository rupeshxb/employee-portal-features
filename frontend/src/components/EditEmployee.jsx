import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../style/AddEmployee.css";
import "../style/EditEmployee.css";
import { API_BASE_URL } from "../../config";
import { CalendarInputIcon, BackArrowIcon } from "./Icons";
import CountryCodeSelect from "./CountryCodeSelect";
import { getDialCode, detectCountry } from "../data/countryCodes";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const designationRef = useRef(null);

  // Display-only (non-editable) values
  const [readOnly, setReadOnly] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    date_joined: "",
    username: "",
  });

  // Editable form state
  const [formData, setFormData] = useState({
    pan_number: "",
    email: "",
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

  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationSearch, setDesignationSearch] = useState("");
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Close designation dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (designationRef.current && !designationRef.current.contains(e.target)) {
        setShowDesignationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };
        const [mgrRes, deptRes, desigRes, empRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/manager/managers-list/`, { headers }),
          fetch(`${API_BASE_URL}/api/departments/`, { headers }),
          fetch(`${API_BASE_URL}/api/designations/`, { headers }),
          fetch(`${API_BASE_URL}/api/manager/employees/${id}/`, { headers }),
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

        if (empRes.ok) {
          const emp = await empRes.json();

          let formattedDate = "";
          if (emp.date_joined && emp.date_joined !== "-") {
            formattedDate = new Date(emp.date_joined).toISOString().split("T")[0];
          }

          // Parse stored phone numbers to detect country code
          const phoneInfo = detectCountry(emp.phone_number || "");
          const emergencyInfo = detectCountry(emp.emergency_contact || "");

          setReadOnly({
            employee_id: emp.employee_id || "",
            first_name: emp.first_name || "",
            last_name: emp.last_name || "",
            date_joined: formattedDate,
            username: emp.username || "",
          });

          setFormData({
            pan_number: emp.pan_number || "",
            email: emp.email || "",
            personal_email: emp.personal_email || "",
            phone_number: phoneInfo.number,
            emergency_contact: emergencyInfo.number,
            employment_type: emp.employment_type || "Full-Time",
            status: emp.status || "Active",
            department: emp.department || "",
            designation: emp.designation || "",
            reporting_manager: emp.reporting_manager || emp.reports_to || "",
          });

          setPhoneCountry(phoneInfo.countryCode);
          setEmergencyCountry(emergencyInfo.countryCode);

          if (emp.designation_name) setDesignationSearch(emp.designation_name);
        } else {
          setError("Could not fetch employee data.");
        }
      } catch {
        setError("Network error loading data.");
      } finally {
        setFetchingData(false);
      }
    };
    fetchAll();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const newFieldErrors = {};
    if (!formData.email.trim()) newFieldErrors.email = 'Official email is required.';
    if (!formData.phone_number.trim()) newFieldErrors.phone_number = 'Phone number is required.';
    if (!formData.department) newFieldErrors.department = 'Department is required.';
    if (!formData.designation) newFieldErrors.designation = 'Please select a designation from the list.';
    if (!formData.reporting_manager) newFieldErrors.reporting_manager = 'Reporting manager is required.';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const payload = {
      ...formData,
      phone_number: formData.phone_number
        ? getDialCode(phoneCountry) + formData.phone_number
        : "",
      emergency_contact: formData.emergency_contact
        ? getDialCode(emergencyCountry) + formData.emergency_contact
        : "",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/manager/employees/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate("/manager/employee-overview");
      } else {
        const errData = await res.json();
        let errorMsg = "Failed to update employee.";
        if (errData.detail) errorMsg = errData.detail;
        else if (typeof errData === "object")
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        setError(errorMsg);
      }
    } catch {
      setError("Network error occurred while updating.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDesignations = designations.filter((d) =>
    d.name.toLowerCase().includes(designationSearch.toLowerCase())
  );

  if (fetchingData) {
    return (
      <div className="add-employee-container">
        <div className="add-employee-page" style={{ padding: "40px 32px", color: "#64748B" }}>
          Loading employee details...
        </div>
      </div>
    );
  }

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
        <h2>Edit Employee</h2>
        <p>Update details for {readOnly.first_name} {readOnly.last_name}.</p>
      </div>

      {/* Form Card */}
      <div className="add-employee-page">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="add-employee-form">

          {/* 1. Account / Login Details — all read-only */}
          <div className="form-section login-details">
            <h3>Account / Login Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Employee ID</label>
                <input type="text" value={readOnly.employee_id} readOnly className="input-readonly" />
              </div>
              <div className="input-group">
                <label>Username</label>
                <input type="text" value={readOnly.username} readOnly className="input-readonly" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" value="placeholder" readOnly className="input-readonly" />
                <span className="readonly-hint">Password can only be changed by the employee via Settings.</span>
              </div>
            </div>
          </div>

          {/* 2. Personal Details — name & joined date read-only; PAN editable */}
          <div className="form-section">
            <h3>Personal Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>First Name</label>
                <input type="text" value={readOnly.first_name} readOnly className="input-readonly" />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" value={readOnly.last_name} readOnly className="input-readonly" />
              </div>
              <div className="input-group">
                <label>Joined Date</label>
                <div className="date-input-wrapper">
                  <input type="date" value={readOnly.date_joined} readOnly className="input-readonly" />
                  <CalendarInputIcon className="date-input-icon" />
                </div>
              </div>
              <div className="input-group">
                <label>PAN Number</label>
                <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="Enter PAN number" />
              </div>
            </div>
          </div>

          {/* 3. Contact Details — fully editable */}
          <div className="form-section">
            <h3>Contact Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Official Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Official email" className={fieldErrors.email ? 'input-error' : ''} />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>
              <div className="input-group">
                <label>Personal Email</label>
                <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} placeholder="Personal email" />
              </div>
              <div className="input-group">
                <label>Phone Number *</label>
                <div className={`phone-input-wrapper ${fieldErrors.phone_number ? 'input-error' : ''}`}>
                  <CountryCodeSelect value={phoneCountry} onChange={setPhoneCountry} />
                  <span className="phone-divider" />
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone number" className="phone-number-input" />
                </div>
                {fieldErrors.phone_number && <span className="field-error">{fieldErrors.phone_number}</span>}
              </div>
              <div className="input-group">
                <label>Emergency Contact Number</label>
                <div className="phone-input-wrapper">
                  <CountryCodeSelect value={emergencyCountry} onChange={setEmergencyCountry} />
                  <span className="phone-divider" />
                  <input type="tel" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Phone number" className="phone-number-input" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Employment Details — fully editable */}
          <div className="form-section">
            <h3>Employment Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Employment Type *</label>
                <select name="employment_type" required value={formData.employment_type} onChange={handleChange}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="input-group">
                <label>Status *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="status" value="Active" checked={formData.status === "Active"} onChange={handleChange} />
                    <span className="radio-custom" />
                    Active
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="status" value="Inactive" checked={formData.status === "Inactive"} onChange={handleChange} />
                    <span className="radio-custom" />
                    Inactive
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleChange} className={fieldErrors.department ? 'input-error' : ''}>
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
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
                <label>Reporting Manager *</label>
                <select name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} className={fieldErrors.reporting_manager ? 'input-error' : ''}>
                  <option value="">Select Manager</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>{mgr.full_name || mgr.username}</option>
                  ))}
                </select>
                {fieldErrors.reporting_manager && <span className="field-error">{fieldErrors.reporting_manager}</span>}
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

export default EditEmployee;
