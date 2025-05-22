// File: tools/zomatoTool.js
// Zomato tool for interacting with the mock Zomato API

const axios = require('axios');

const name = 'zomato';

// Base URL for the mock Zomato API
const BASE_URL = process.env.ZOMATO_API_URL || 'http://localhost:9000';

const actions = {
  // Get all orders
  async getOrders() {
    try {
      const response = await axios.get(`${BASE_URL}/orders`);
  
      return response.data;
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders from Zomato API');
    }
  },

  // Get a specific order by ID
  async getOrderById(params = {}) {
    if (!params.id) {
      throw new Error('Order ID parameter is required');
    }

    try {
      const response = await axios.get(`${BASE_URL}/orders`);
      const order = response.data.orders.find(order => order.id === params.id);
      
      if (!order) {
        throw new Error(`Order with ID ${params.id} not found`);
      }
      
      return order;
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.message || 'Failed to fetch order from Zomato API');
    }
  },

  // Update order status to 'picked'
  async pickupOrder(params = {}) {
    if (!params.id) {
      throw new Error('Order ID parameter is required');
    }

    try {
      const response = await axios.post(`${BASE_URL}/pickup`, {
        id: params.id
      });
      
      return response.data;
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  },
  
  // Get orders by status
  async getOrdersByStatus(params = {}) {
    if (!params.status) {
      throw new Error('Status parameter is required');
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/orders`);
      const filteredOrders = response.data.orders.filter(order => 
        order.status.toLowerCase() === params.status.toLowerCase()
      );
      
      return { orders: filteredOrders };
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders by status');
    }
  },
  
  // Get orders by location
  async getOrdersByLocation(params = {}) {
    if (!params.location) {
      throw new Error('Location parameter is required');
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/orders`);
      const filteredOrders = response.data.orders.filter(order => 
        order.location.toLowerCase().includes(params.location.toLowerCase())
      );
      
      return { orders: filteredOrders };
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders by location');
    }
  },
  
  // Get orders by customer
  async getOrdersByCustomer(params = {}) {
    if (!params.customer) {
      throw new Error('Customer parameter is required');
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/orders`);
      const filteredOrders = response.data.orders.filter(order => 
        order.customer.toLowerCase().includes(params.customer.toLowerCase())
      );
      
      return { orders: filteredOrders };
    } catch (error) {
      console.error('Zomato API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders by customer');
    }
  }
};

module.exports = {
  name,
  actions
};