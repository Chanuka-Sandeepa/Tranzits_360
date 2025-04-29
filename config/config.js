const config = {
    JWT_SECRET: process.env.JWT_SECRET || '12345asdfghjk',
    JWT_EXPIRE: '24h',
    ROLES: {
      ADMIN: 'admin',
      DRIVER: 'driver',
      PASSENGER: 'passenger'
    }
  };
  
  export default config;
  