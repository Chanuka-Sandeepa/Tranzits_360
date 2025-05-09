import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFilter, FiDownload, FiEye, FiCheck, FiX, FiLoader, FiRefreshCw } from 'react-icons/fi';

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    routeId: 'all',
    startDate: '',
    endDate: ''
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchRoutes();
    fetchUsers();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { status, routeId, startDate, endDate } = filterOptions;
      let url = 'http://localhost:5000/api/tickets';
      const params = new URLSearchParams();
      
      if (status !== 'all') params.append('status', status);
      if (routeId !== 'all') params.append('routeId', routeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setTickets(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tickets. Please try again.');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      setRoutes(response.data.data);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(response.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions({ ...filterOptions, [name]: value });
  };

  const applyFilters = () => {
    fetchTickets();
    setIsFilterExpanded(false);
  };

  const resetFilters = () => {
    setFilterOptions({
      status: 'all',
      routeId: 'all',
      startDate: '',
      endDate: ''
    });
    fetchTickets();
  };

  const handleOpenViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTicket(null);
  };

  const handleValidateTicket = async (ticket) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await axios.post(`http://localhost:5000/api/tickets/validate`, { qrCode: ticket.qrCode });
      fetchTickets();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to validate ticket. Please try again.';
      setError(errorMessage);
      console.error('Error validating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}/cancel`);
      fetchTickets();
    } catch (err) {
      setError('Failed to cancel ticket. Please try again.');
      console.error('Error cancelling ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportTicketsToCSV = () => {
    const filteredTickets = tickets;
    
    // Prepare CSV header
    let csv = 'Ticket ID,Passenger,Route,Purchased At,Status,Price,Valid From,Valid Until\n';
    
    // Add ticket data
    filteredTickets.forEach(ticket => {
      const route = routes.find(r => r._id === ticket.route._id);
      const passenger = users.find(u => u._id === ticket.passenger._id);
      
      csv += `${ticket._id},`;
      csv += `${passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown'},`;
      csv += `${route ? route.name : ticket.route.name},`;
      csv += `${formatDateTime(ticket.purchasedAt)},`;
      csv += `${ticket.status},`;
      csv += `$${ticket.price.toFixed(2)},`;
      csv += `${formatDateTime(ticket.validFrom)},`;
      csv += `${formatDateTime(ticket.validUntil)}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'tickets_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ticket Management</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="mr-2" /> Filter
          </button>
          <button 
            onClick={exportTicketsToCSV}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FiDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      {isFilterExpanded && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filterOptions.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <select
                name="routeId"
                value={filterOptions.routeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Routes</option>
                {routes.map(route => (
                  <option key={route._id} value={route._id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filterOptions.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filterOptions.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset Filters
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {tickets.length} tickets
        </div>
        <button 
          onClick={fetchTickets}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiRefreshCw className="mr-1" /> Refresh
        </button>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin text-indigo-600 text-2xl mr-2" />
          <span>Loading tickets...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const passenger = users.find(u => u._id === ticket.passenger._id) || ticket.passenger;
                  const route = routes.find(r => r._id === ticket.route._id) || ticket.route;
                  
                  return (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {passenger.firstName} {passenger.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{passenger.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{route.name}</div>
                          <div className="text-sm text-gray-500">Route #{route.routeNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDateTime(ticket.purchasedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${ticket.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleOpenViewModal(ticket)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="inline" />
                        </button>
                        {ticket.status === 'active' && (
                          <>
                            <button 
                              onClick={() => handleValidateTicket(ticket)}
                              className="text-green-600 hover:text-green-900"
                              title="Validate Ticket"
                            >
                              <FiCheck className="inline" />
                            </button>
                            <button 
                              onClick={() => handleCancelTicket(ticket._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Ticket"
                            >
                              <FiX className="inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No tickets found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Ticket Modal */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Ticket Details</h3>
              <button 
                onClick={handleCloseViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg mb-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold text-lg text-indigo-800">Ticket #{selectedTicket._id.slice(-6)}</h4>
                  <p className="text-indigo-600">
                    Status: <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </p>
                  <p className="text-sm text-indigo-600">
                    Type: {selectedTicket.ticketType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-800">${selectedTicket.price.toFixed(2)}</p>
                  <p className="text-sm text-indigo-600">
                    {formatDate(selectedTicket.purchasedAt)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Passenger Information</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p><span className="font-medium">Name:</span> {selectedTicket.passenger.firstName} {selectedTicket.passenger.lastName}</p>
                <p><span className="font-medium">Email:</span> {selectedTicket.passenger.email}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Route Information</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p><span className="font-medium">Route:</span> {selectedTicket.route.name}</p>
                <p><span className="font-medium">Route Number:</span> {selectedTicket.route.routeNumber}</p>
                <p><span className="font-medium">Type:</span> {selectedTicket.route.type}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Validity Period</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p><span className="font-medium">Valid From:</span> {formatDateTime(selectedTicket.validFrom)}</p>
                <p><span className="font-medium">Valid Until:</span> {formatDateTime(selectedTicket.validUntil)}</p>
              </div>
            </div>
            
            {selectedTicket.usedAt && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Usage Information</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p><span className="font-medium">Used At:</span> {formatDateTime(selectedTicket.usedAt)}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              {selectedTicket.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      handleValidateTicket(selectedTicket);
                      handleCloseViewModal();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Validate Ticket
                  </button>
                  <button
                    onClick={() => {
                      handleCancelTicket(selectedTicket._id);
                      handleCloseViewModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel Ticket
                  </button>
                </>
              )}
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagement;