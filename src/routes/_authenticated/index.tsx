import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  component: Homepage,
})

function Homepage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Storage</h1>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0"></div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg col-span-2">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm">No recent activity to show.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 ">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Add New Item
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Add New Container
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
