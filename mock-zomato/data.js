const locations = ['Clement Town', 'Race Course', 'Fountain Chowk', 'Nehru Colony', 'Mohkhampur'];

export const generateRandomOrders = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    customer: `Customer ${i + 1}`,
    location: locations[Math.floor(Math.random() * locations.length)],
    status: 'pending'
  }));
};

