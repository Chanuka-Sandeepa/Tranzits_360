const AnalyticsTabs = ({ activeTab, setActiveTab }) => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-4 px-1 ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`pb-4 px-1 ${
                activeTab === 'routes'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Routes
            </button>
          </nav>
        </div>
      </div>
    );
  };
  
  export default AnalyticsTabs;