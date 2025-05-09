const AnalyticsTable = ({ columns, data }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th 
                  key={column.header}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td 
                    key={`${index}-${column.accessor}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {column.format ? column.format(item[column.accessor]) : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default AnalyticsTable;