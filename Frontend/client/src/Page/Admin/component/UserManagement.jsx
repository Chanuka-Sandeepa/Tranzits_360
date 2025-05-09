import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiUser, FiUserCheck, FiUserX } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, drivers, passengers
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // New state for add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    adminKey: '',
    idNumber: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let endpoint = 'http://localhost:5000/api/admin/users';
      
      if (activeTab === 'drivers') {
        endpoint = 'http://localhost:5000/api/admin/drivers';
      } else if (activeTab === 'passengers') {
        endpoint = 'http://localhost:5000/api/admin/passengers';
      }
      const response = await axios.get(endpoint);
      console.log("users response:", response);

      // Make sure we're setting an array to the users state
      // Check if response.data is an array or if it has a property that's an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // If API returns an object with a users property or similar
        const dataArray = response.data.users || response.data.data || [];
        setUsers(Array.isArray(dataArray) ? dataArray : []);
      } else {
        // Fallback to empty array
        setUsers([]);
        setError('Received invalid data format from server');
      }
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]); // Ensure users is an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
      // Remove user from state
      setUsers(prev => Array.isArray(prev) ? prev.filter(user => user._id !== userId) : []);
      setConfirmDelete(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  // New handlers for add user form
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/register-admin', formData);

      setFormSuccess('Admin user created successfully!');
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        adminKey: '',
        idNumber: ''
      });
      console.log('Admin user created:', response.data);
      
      // Refresh user list
      fetchUsers();
      
      // Close modal after delay
      setTimeout(() => {
        setShowAddModal(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating admin:', err);
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter users based on search term - with safety check
  const filteredUsers = Array.isArray(users) 
    ? users.filter(user => 
        (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="mt-1 text-gray-600">Manage system users, drivers, and passengers.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add New User
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-4">
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all' 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Users
              </button>
              <button 
                onClick={() => setActiveTab('drivers')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'drivers' 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Drivers
              </button>
              <button 
                onClick={() => setActiveTab('passengers')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'passengers' 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Passengers
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'driver' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.idNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmDelete(true);
                        }}
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {selectedUser.firstName} {selectedUser.lastName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Admin User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  minLength="6"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  pattern="\d{10}"
                  placeholder="10 digits required"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idNumber">
                  ID Number (Optional)
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Default will be generated if not provided"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminKey">
                  Admin Registration Key
                </label>
                <input
                  type="password"
                  id="adminKey"
                  name="adminKey"
                  value={formData.adminKey}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mr-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                >
                  {formLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;