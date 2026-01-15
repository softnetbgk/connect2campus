# Use Node.js 18 LTS
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Your backend runs on port 5000 (based on your axios.js config)
EXPOSE 5000

# Start the application
CMD [ "node", "src/server.js" ]
