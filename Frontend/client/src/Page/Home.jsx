import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {

  const navigate = useNavigate(); 

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-transparent z-10"></div>
        <img 
          src="https://public.readdy.ai/ai/img_res/6e89d70f94649ffe3ea5257f25265272.jpg" 
          alt="Tranzit 360" 
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Tranzit 360</h1>
            <p className="text-xl mb-8">The complete transit management solution for modern transportation systems. Streamline your operations, enhance passenger experience, and optimize your fleet with our all-in-one platform.</p>
            <div className="flex flex-wrap gap-4">
            <button 
                className="bg-white text-blue-900 px-8 py-3 font-semibold rounded cursor-pointer whitespace-nowrap hover:bg-opacity-90 transition" 
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button 
                className="border-2 border-white text-white px-8 py-3 font-semibold rounded cursor-pointer whitespace-nowrap hover:bg-white hover:bg-opacity-10 transition"
                onClick={() => navigate('/register')}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Transit Management</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">Our comprehensive suite of tools helps you manage every aspect of your transit operations efficiently.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16a6 6 0 006-6c0-1.655-1.122-3.055-2.722-3.744 1.378-.688 2.222-2.088 2.222-3.744C13.5 1.122 11.878 0 10 0S6.5 1.122 6.5 2.512c0 1.656.844 3.056 2.222 3.744C7.122 6.945 6 8.345 6 10c0 3.314 3.134 6 6 6z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Fleet Management</h3>
              <p className="text-gray-600 text-center">Track and manage your entire fleet in real-time. Monitor vehicle status, maintenance schedules, and driver assignments.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Route Planning</h3>
              <p className="text-gray-600 text-center">Optimize routes for efficiency and passenger convenience. Analyze traffic patterns and adjust schedules in real-time.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  <path fillRule="evenodd" d="M5 11a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Ticketing System</h3>
              <p className="text-gray-600 text-center">Seamless digital ticketing solutions for passengers. Support for multiple payment methods and fare management.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">User Management</h3>
              <p className="text-gray-600 text-center">Comprehensive tools for managing staff, drivers, and administrative users with role-based access control.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose TransitHub?</h2>
              <p className="text-gray-600 mb-8">TransitHub is designed to address the complex challenges of modern transit operations. Our platform helps you increase efficiency, reduce costs, and improve passenger satisfaction.</p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Increased Operational Efficiency</h4>
                    <p className="text-gray-600">Streamline your operations and reduce administrative overhead.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Enhanced Passenger Experience</h4>
                    <p className="text-gray-600">Provide real-time updates, digital ticketing, and improved service reliability.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Data-Driven Decisions</h4>
                    <p className="text-gray-600">Access comprehensive analytics and reporting to optimize your transit system.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="https://public.readdy.ai/ai/img_res/51f96aa7b65ef29da908371ac7a6e878.jpg" 
                  alt="Tranzit 360 Dashboard" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Transit Operations?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Join hundreds of transit authorities who have improved their operations with TransitHub.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-900 px-8 py-3 font-semibold rounded cursor-pointer whitespace-nowrap hover:bg-gray-100 transition">Get Started</button>
            <button className="border-2 border-white text-white px-8 py-3 font-semibold rounded cursor-pointer whitespace-nowrap hover:bg-white hover:bg-opacity-10 transition">Log In</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TransitHub</h3>
              <p className="text-gray-400">The complete transit management solution for modern transportation systems.</p>
              <div className="flex mt-4 space-x-4">
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Case Studies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TransitHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;