import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose'; // Add this import
import Trip from '../models/Trip.js';
import Ticket from '../models/Ticket.js';
import Route from '../models/Route.js';
import Vehicle from '../models/Vehicle.js';

// @desc    Get system dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  // Get current date
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const tomorrow = new Date(new Date(now).setDate(now.getDate() + 1));
  
  // Get time range from query params
  const { timeRange } = req.query;
  let startDate = today;
  
  // Adjust date range based on timeRange parameter
  if (timeRange === 'week') {
    startDate = new Date(new Date().setDate(today.getDate() - 7));
  } else if (timeRange === 'month') {
    startDate = new Date(new Date().setDate(today.getDate() - 30));
  } else if (timeRange === 'year') {
    startDate = new Date(new Date().setFullYear(today.getFullYear() - 1));
  }
  
  // Get counts
  const activeTripsCount = await Trip.countDocuments({ status: 'in-progress' });
  const todayTripsCount = await Trip.countDocuments({
    startTime: { $gte: today, $lt: tomorrow }
  });
  
  const activeRoutesCount = await Route.countDocuments({ isActive: true });
  const availableVehiclesCount = await Vehicle.countDocuments({ status: 'active' });
  
  // Get ticket sales for the selected time range
  const tickets = await Ticket.find({
    purchasedAt: { $gte: startDate, $lte: tomorrow }
  });

  const totalRevenue = tickets.reduce((total, ticket) => total + ticket.price, 0);
  const ticketsCount = tickets.length;

  // Get previous period's revenue for growth calculation
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(startDate);
  const periodLength = tomorrow - startDate;
  
  previousStartDate.setTime(previousStartDate.getTime() - periodLength);
  previousEndDate.setTime(previousEndDate.getTime() - periodLength);

  const previousTickets = await Ticket.find({
    purchasedAt: { $gte: previousStartDate, $lte: previousEndDate }
  });

  const previousRevenue = previousTickets.reduce((total, ticket) => total + ticket.price, 0);
  const revenueGrowth = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  // Get recent incidents
  const recentIncidents = await Trip.aggregate([
    { $unwind: '$incidents' },
    { $match: { 'incidents.resolved': false } },
    { $sort: { 'incidents.time': -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'routes',
        localField: 'route',
        foreignField: '_id',
        as: 'routeInfo'
      }
    },
    {
      $project: {
        _id: 1,
        'routeInfo.routeNumber': 1,
        'routeInfo.name': 1,
        'incidents.type': 1,
        'incidents.description': 1,
        'incidents.time': 1
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalPassengers: ticketsCount,
        passengerGrowth: 5.3, // Mock data, would need to calculate
        activeTrips: activeTripsCount,
        tripGrowth: 2.7, // Mock data, would need to calculate
        activeVehicles: availableVehiclesCount,
        vehicleGrowth: 1.8, // Mock data, would need to calculate
        revenue: totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10 // Round to 1 decimal place
      },
      counts: {
        activeTrips: activeTripsCount,
        todayTrips: todayTripsCount,
        activeRoutes: activeRoutesCount,
        availableVehicles: availableVehiclesCount,
        todayTickets: ticketsCount
      },
      revenue: {
        total: totalRevenue,
        previous: previousRevenue,
        growth: revenueGrowth
      },
      recentIncidents,
      // Add data for charts
      ticketSales: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        dataPoints: [1200, 1900, 1500, 1800, 2200, 2400, 1800]
      },
      riderCounts: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        dataPoints: [3500, 4200, 3800, 4100, 4500, 4800, 4200]
      }
    }
  });
});

// @desc    Get route performance analytics
// @route   GET /api/analytics/routes
// @access  Private/Admin
export const getRouteAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, routeId, timeRange } = req.query;
  
  // Default to last 30 days if dates not provided
  const endDateObj = endDate ? new Date(endDate) : new Date();
  endDateObj.setHours(23, 59, 59, 999);
  
  let startDateObj;
  
  // Handle timeRange parameter
  if (timeRange) {
    startDateObj = new Date();
    if (timeRange === 'week') {
      startDateObj.setDate(startDateObj.getDate() - 7);
    } else if (timeRange === 'month') {
      startDateObj.setDate(startDateObj.getDate() - 30);
    } else if (timeRange === 'year') {
      startDateObj.setFullYear(startDateObj.getFullYear() - 1);
    }
  } else {
    startDateObj = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      startDateObj.setDate(startDateObj.getDate() - 30);
    }
  }
  
  startDateObj.setHours(0, 0, 0, 0);
  
  // Build query
  let matchQuery = {
    startTime: { $gte: startDateObj, $lte: endDateObj },
    status: { $in: ['completed', 'in-progress'] }
  };
  
  if (routeId) {
    matchQuery.route = mongoose.Types.ObjectId(routeId);
  }
  
  // Get route performance
  const routePerformance = await Trip.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'routes',
        localField: 'route',
        foreignField: '_id',
        as: 'routeInfo'
      }
    },
    { $unwind: '$routeInfo' },
    {
      $group: {
        _id: '$route',
        routeNumber: { $first: '$routeInfo.routeNumber' },
        routeName: { $first: '$routeInfo.name' },
        type: { $first: '$routeInfo.type' },
        tripCount: { $sum: 1 },
        avgDelay: { $avg: '$delay' },
        totalPassengers: { $sum: '$passengerCount' },
        incidentCount: { $sum: { $size: '$incidents' } }
      }
    },
    { $sort: { tripCount: -1 } }
  ]);
  
  // Get ticket sales by route
  const ticketSalesByRoute = await Ticket.aggregate([
    {
      $match: {
        purchasedAt: { $gte: startDateObj, $lte: endDateObj }
      }
    },
    {
      $lookup: {
        from: 'routes',
        localField: 'route',
        foreignField: '_id',
        as: 'routeInfo'
      }
    },
    { $unwind: '$routeInfo' },
    {
      $group: {
        _id: '$route',
        routeNumber: { $first: '$routeInfo.routeNumber' },
        routeName: { $first: '$routeInfo.name' },
        ticketCount: { $sum: 1 },
        revenue: { $sum: '$price' },
        ticketTypes: {
          $push: {
            type: '$ticketType',
            price: '$price'
          }
        }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  
  // Mock data for frontend charts
  const topRoutesByRevenue = ticketSalesByRoute.map(route => ({
    id: route._id.toString(),
    name: route.routeName,
    revenue: route.revenue
  }));
  
  const routeUtilization = routePerformance.map(route => ({
    id: route._id.toString(),
    name: route.routeName,
    utilization: Math.floor(Math.random() * 45) + 50 // Mock data
  }));
  
  const revenueDistribution = {};
  let totalRevenue = 0;
  
  ticketSalesByRoute.forEach(route => {
    totalRevenue += route.revenue;
  });
  
  ticketSalesByRoute.forEach(route => {
    revenueDistribution[route.routeName] = Math.round((route.revenue / totalRevenue) * 100);
  });
  
  const onTimePerformance = routePerformance.map(route => ({
    id: route._id.toString(),
    name: route.routeName,
    onTimeRate: 100 - Math.min(100, Math.round(route.avgDelay || 0))
  }));
  
  res.status(200).json({
    success: true,
    data: {
      routePerformance,
      ticketSalesByRoute,
      topRoutesByRevenue,
      routeUtilization,
      revenueDistribution,
      onTimePerformance,
      routeDetails: routePerformance.map(route => ({
        id: route._id.toString(),
        name: route.routeName,
        ridership: route.totalPassengers,
        revenue: ticketSalesByRoute.find(r => r._id.toString() === route._id.toString())?.revenue || 0,
        onTimePercentage: 100 - Math.min(100, Math.round(route.avgDelay || 0)),
        incidents: route.incidentCount
      }))
    }
  });
});

// @desc    Get driver performance analytics
// @route   GET /api/analytics/drivers
// @access  Private/Admin
export const getDriverAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, timeRange } = req.query;
  
  // Default to last 30 days if dates not provided
  const endDateObj = endDate ? new Date(endDate) : new Date();
  endDateObj.setHours(23, 59, 59, 999);
  
  let startDateObj;
  
  // Handle timeRange parameter
  if (timeRange) {
    startDateObj = new Date();
    if (timeRange === 'week') {
      startDateObj.setDate(startDateObj.getDate() - 7);
    } else if (timeRange === 'month') {
      startDateObj.setDate(startDateObj.getDate() - 30);
    } else if (timeRange === 'year') {
      startDateObj.setFullYear(startDateObj.getFullYear() - 1);
    }
  } else {
    startDateObj = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      startDateObj.setDate(startDateObj.getDate() - 30);
    }
  }
  
  startDateObj.setHours(0, 0, 0, 0);
  
  // Get driver performance metrics
  const driverPerformance = await Trip.aggregate([
    {
      $match: {
        startTime: { $gte: startDateObj, $lte: endDateObj },
        status: { $in: ['completed', 'in-progress'] }
      }
    },
    {
      $lookup: {
        from: 'drivers',
        localField: 'driver',
        foreignField: '_id',
        as: 'driverInfo'
      }
    },
    { $unwind: '$driverInfo' },
    {
      $lookup: {
        from: 'users',
        localField: 'driverInfo.user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $group: {
        _id: '$driver',
        driverName: {
          $first: {
            $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName']
          }
        },
        tripCount: { $sum: 1 },
        avgDelay: { $avg: '$delay' },
        totalPassengers: { $sum: '$passengerCount' },
        incidentCount: { $sum: { $size: '$incidents' } },
        onTimePerformance: {
          $avg: {
            $cond: [{ $lte: ['$delay', 5] }, 1, 0]  // On time if delay <= 5 minutes
          }
        }
      }
    },
    {
      $addFields: {
        onTimePercentage: { $multiply: ['$onTimePerformance', 100] }
      }
    },
    { $sort: { tripCount: -1 } }
  ]);
  
  // Create formatted data for frontend
  const driverRatings = driverPerformance.map(driver => ({
    id: driver._id.toString(),
    name: driver.driverName,
    rating: Math.round(driver.onTimePercentage)
  }));
  
  // Mock incident types distribution
  const incidentTypes = {
    mechanical: 15,
    traffic: 25,
    weather: 10,
    passenger: 8,
    other: 5
  };
  
  const tripsCompleted = driverPerformance.map(driver => ({
    id: driver._id.toString(),
    name: driver.driverName,
    trips: driver.tripCount
  }));
  
  // Mock customer ratings (would come from a different collection in a real app)
  const customerRatings = driverPerformance.map(driver => ({
    id: driver._id.toString(),
    name: driver.driverName,
    rating: (Math.random() * 2) + 3
  }));
  
  res.status(200).json({
    success: true,
    data: {
      driverPerformance,
      driverRatings,
      incidentTypes,
      tripsCompleted,
      customerRatings,
      topDrivers: driverPerformance.map(driver => ({
        id: driver._id.toString(),
        name: driver.driverName,
        tripsCompleted: driver.tripCount,
        onTimeRate: Math.round(driver.onTimePercentage),
        rating: customerRatings.find(r => r.id === driver._id.toString())?.rating || 3.5,
        incidents: driver.incidentCount
      }))
    }
  });
});
