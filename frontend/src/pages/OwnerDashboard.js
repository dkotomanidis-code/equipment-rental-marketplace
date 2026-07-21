import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'tools',
  pricePerDay: '',
  condition: 'good',
  year: '',
  location: '',
  imageUrl: '',
};

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Rental history state
  const [rentalHistory, setRentalHistory] = useState([]);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

  const token = localStorage.getItem('token');

  const authHeaders = { headers: { Authorization: `Bearer ${token} } };

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/owner/equipment`, authHeaders);
      setEquipment(res.data);
    } catch (err) {
      setError('Failed to load your equipment listings.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'tools',
      pricePerDay: item.pricePerDay || '',
      condition: item.condition || 'good',
      year: item.year || '',
      location: item.location || '',
      imageUrl: item.imageUrl || '',
    });
    setFormError('');
    setShowForm(true);
    setActiveTab('equipment');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Equipment name is required.');
      return;
    }
    if (!form.pricePerDay || isNaN(parseFloat(form.pricePerDay)) || parseFloat(form.pricePerDay) <= 0) {
      setFormError('A valid price per day is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/owner/equipment/${editingId}`, form, authHeaders);
        showSuccess('Equipment updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/owner/equipment`, form, authHeaders);
        showSuccess('Equipment added successfully!');
      }
      closeForm();
      fetchEquipment();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save equipment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/owner/equipment/${id}`, authHeaders);
      setEquipment((prev) => prev.filter((e) => e.id !== id));
      showSuccess('Equipment deleted.');
    } catch (err) {
      setError('Failed to delete equipment.');
    }
  };

  // ── Toggle availability ──────────────────────────────────────────────────────

  const handleToggleAvailability = async (id) => {
    try {
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/owner/equipment/${id}/toggle-availability`,
        {},
        authHeaders
      );
      setEquipment((prev) => prev.map((e) => (e.id === id ? res.data : e)));
    } catch (err) {
      setError('Failed to toggle availability.');
    }
  };

  // ── Rental history ───────────────────────────────────────────────────────────

  const handleViewRentals = async (item) => {
    setSelectedEquipmentId(item.id);
    setActiveTab('rentals');
    setRentalLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/owner/equipment/${item.id}/rentals`,
        authHeaders
      );
      setRentalHistory(res.data);
    } catch (err) {
      setRentalHistory([]);
    } finally {
      setRentalLoading(false);
    }
  };

  const selectedItem = equipment.find((e) => e.id === selectedEquipmentId);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="owner-dashboard-page">
      <div className="owner-dashboard-container">
        {/* Header */}
        <div className="owner-dashboard-header">
          <div>
            <h1 className="owner-dashboard-title">🏗️ My Equipment Dashboard</h1>
            <p className="owner-dashboard-subtitle">Manage your listings, availability and rental history</p>
          </div>
          <button className="btn btn-primary owner-dashboard-add-btn" onClick={openAddForm}>
            + Add Equipment
          </button>
        </div>

        {/* Global messages */}
        {successMsg && <div className="owner-dashboard-success">{successMsg}</div>}
        {error && <div className="owner-dashboard-error">{error}</div>}

        {/* Tabs */}
        <div className="owner-dashboard-tabs">
          <button
            className={`owner-dashboard-tab${activeTab === 'equipment' ? ' owner-dashboard-tab--active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            My Equipment
          </button>
          <button
            className={`owner-dashboard-tab${activeTab === 'rentals' ? ' owner-dashboard-tab--active' : ''}`}
            onClick={() => setActiveTab('rentals')}
          >
            Rental History
          </button>
        </div>

        {/* ── Add / Edit Form ───────────────────────────────────── */}
        {showForm && (
          <div className="equipment-form-overlay">
            <div className="equipment-form-modal">
              <div className="equipment-form-modal-header">
                <h2 className="equipment-form-modal-title">
                  {editingId ? 'Edit Equipment' : 'Add New Equipment'}
                </h2>
                <button className="equipment-form-close-btn" onClick={closeForm} aria-label="Close">
                  ✕
                </button>
              </div>

              {formError && <div className="owner-dashboard-error">{formError}</div>}

              <form className="equipment-form" onSubmit={handleFormSubmit}>
                <div className="equipment-form-grid">
                  <div className="equipment-form-group equipment-form-group--full">
                    <label className="equipment-form-label">Equipment Name *</label>
                    <input
                      className="equipment-form-input"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="e.g. Excavator CAT 320"
                      required
                    />
                  </div>

                  <div className="equipment-form-group equipment-form-group--full">
                    <label className="equipment-form-label">Description</label>
                    <textarea
                      className="equipment-form-input equipment-form-textarea"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the equipment, its features and usage..."
                      rows={3}
                    />
                  </div>

                  <div className="equipment-form-group">
                    <label className="equipment-form-label">Category</label>
                    <select
                      className="equipment-form-input"
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                    >
                      <option value="tools">Tools</option>
                      <option value="heavy-machinery">Heavy Machinery</option>
                      <option value="construction">Construction</option>
                      <option value="agricultural">Agricultural</option>
                      <option value="transportation">Transportation</option>
                      <option value="sports">Sports</option>
                      <option value="cameras">Cameras</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="equipment-form-group">
                    <label className="equipment-form-label">Price per Day ($) *</label>
                    <input
                      className="equipment-form-input"
                      type="number"
                      name="pricePerDay"
                      value={form.pricePerDay}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="equipment-form-group">
                    <label className="equipment-form-label">Condition</label>
                    <select
                      className="equipment-form-input"
                      name="condition"
                      value={form.condition}
                      onChange={handleFormChange}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div className="equipment-form-group">
                    <label className="equipment-form-label">Year</label>
                    <input
                      className="equipment-form-input"
                      type="number"
                      name="year"
                      value={form.year}
                      onChange={handleFormChange}
                      placeholder="e.g. 2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="equipment-form-group">
                    <label className="equipment-form-label">Location</label>
                    <input
                      className="equipment-form-input"
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleFormChange}
                      placeholder="City, Region"
                    />
                  </div>

                  <div className="equipment-form-group equipment-form-group--full">
                    <label className="equipment-form-label">Image URL</label>
                    <input
                      className="equipment-form-input"
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleFormChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="equipment-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeForm}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                    {formSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Equipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Equipment List Tab ────────────────────────────────── */}
        {activeTab === 'equipment' && (
          <div className="owner-dashboard-content">
            {loading ? (
              <div className="owner-dashboard-loading">Loading your equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="owner-dashboard-empty">
                <div className="owner-dashboard-empty-icon">🏗️</div>
                <p>You have no equipment listed yet.</p>
                <button className="btn btn-primary" onClick={openAddForm}>
                  Add Your First Equipment
                </button>
              </div>
            ) : (
              <div className="owner-dashboard-table-wrapper">
                <table className="owner-dashboard-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price/Day</th>
                      <th>Condition</th>
                      <th>Year</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.imageUrl ? (
                            <img
                              className="owner-dashboard-thumb"
                              src={item.imageUrl}
                              alt={item.name}
                            />
                          ) : (
                            <div className="owner-dashboard-thumb-placeholder">🏗️</div>
                          )}
                        </td>
                        <td className="owner-dashboard-item-name">{item.name}</td>
                        <td>{item.category}</td>
                        <td className="owner-dashboard-price">${item.pricePerDay}</td>
                        <td>
                          <span className={`owner-dashboard-condition owner-dashboard-condition--${item.condition}`}>
                            {item.condition}
                          </span>
                        </td>
                        <td>{item.year || '—'}</td>
                        <td>{item.location || '—'}</td>
                        <td>
                          <button
                            className={`owner-dashboard-toggle${item.availabilityStatus ? ' owner-dashboard-toggle--active' : ' owner-dashboard-toggle--inactive'}`}
                            onClick={() => handleToggleAvailability(item.id)}
                            title="Toggle availability"
                          >
                            {item.availabilityStatus ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <div className="owner-dashboard-actions">
                            <button
                              className="owner-dashboard-action-btn owner-dashboard-action-btn--edit"
                              onClick={() => openEditForm(item)}
                              title="Edit"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="owner-dashboard-action-btn owner-dashboard-action-btn--history"
                              onClick={() => handleViewRentals(item)}
                              title="Rental history"
                            >
                              📋 History
                            </button>
                            <button
                              className="owner-dashboard-action-btn owner-dashboard-action-btn--delete"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Rental History Tab ────────────────────────────────── */}
        {activeTab === 'rentals' && (
          <div className="owner-dashboard-content">
            <div className="owner-dashboard-rentals-header">
              <h3 className="owner-dashboard-rentals-title">
                Rental History{selectedItem ? ` — ${selectedItem.name}` : ''}
              </h3>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('equipment')}
              >
                ← Back to Equipment
              </button>
            </div>

            {rentalLoading ? (
              <div className="owner-dashboard-loading">Loading rental history...</div>
            ) : rentalHistory.length === 0 ? (
              <div className="owner-dashboard-empty">
                <div className="owner-dashboard-empty-icon">📋</div>
                <p>No rentals recorded for this equipment yet.</p>
              </div>
            ) : (
              <div className="owner-dashboard-table-wrapper">
                <table className="owner-dashboard-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Renter</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalHistory.map((rental) => (
                      <tr key={rental.id}>
                        <td>#{rental.id}</td>
                        <td>{rental.renterName || rental.renterId || '—'}</td>
                        <td>{rental.startDate}</td>
                        <td>{rental.endDate}</td>
                        <td>${rental.totalPrice}</td>
                        <td>
                          <span className={`owner-dashboard-status owner-dashboard-status--${rental.status}`}>
                            {rental.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
