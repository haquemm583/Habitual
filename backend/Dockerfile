# backend dockerfile
# 
# creates the backend container
# 
# created by: CJ Quintero
# created on: 11/07/2026

# use node v26 as base image
FROM node:26

# set working directory
WORKDIR /app

# install node packages in container
COPY package.json package-lock.json ./
RUN npm ci

# copy backend files into the container
COPY . .

# expose this port so you can reach the backend server
# on your device from outside the container
EXPOSE 3000

# start the backend server
CMD ["npm", "start"]
