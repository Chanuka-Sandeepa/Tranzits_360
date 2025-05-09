import { useState } from 'react';
import { ArrowLeft, Edit, Trash2, LogOut, ChevronDown } from 'lucide-react';

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  // Sample user data
  const userData = {
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    profileImage: '/api/placeholder/120/120'
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // This would typically navigate to an edit profile form
  };

  const handleDeleteAccount = () => {
    console.log('Delete account clicked');
    // This would typically show a confirmation dialog
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    // This would typically clear auth state and redirect to login
  };

  const handleBackClick = () => {
    console.log('Back button clicked');
    // This would typically navigate back to the dashboard
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-gray-600 mr-4"
          >
            <ArrowLeft size={20} />
            <span className="ml-1">Back</span>
          </button>
          <h1 className="text-blue-600 font-medium text-xl">My Profile</h1>
        </div>
        <button 
          onClick={handleEditProfile}
          className="text-blue-600 flex items-center"
        >
          <Edit size={18} />
          <span className="ml-1">Edit</span>
        </button>
      </header>

      {/* Profile Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
            <img 
              src={userData.profileImage} 
              alt={userData.fullName} 
              className="w-24 h-24 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6"
            />
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-medium">{userData.fullName}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="font-medium">{userData.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-medium">{userData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-medium text-lg mb-4">Settings</h2>
          
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-medium mb-1">Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts about your trips and updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <div className={`w-11 h-6 rounded-full peer ${notifications ? 'bg-blue-600' : 'bg-gray-200'} peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-medium mb-1">Dark Mode</p>
              <p className="text-sm text-gray-500">Switch to dark theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className={`w-11 h-6 rounded-full peer ${darkMode ? 'bg-blue-600' : 'bg-gray-200'} peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
            </label>
          </div>
          
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium mb-1">Language</p>
              <p className="text-sm text-gray-500">Select your preferred language</p>
            </div>
            <div className="relative">
              <select 
                className="appearance-none bg-white border rounded-md py-2 pl-3 pr-10 text-gray-700"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-medium text-lg mb-4">Account Actions</h2>
          
          <button 
            onClick={handleEditProfile}
            className="w-full bg-blue-600 text-white rounded py-3 mb-3 flex items-center justify-center"
          >
            <Edit size={16} className="mr-2" />
            Edit Profile
          </button>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full text-red-600 border border-red-600 rounded py-3 mb-3 flex items-center justify-center"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-700 rounded py-3 flex items-center justify-center"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}