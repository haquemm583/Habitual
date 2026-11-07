# frontend dockerfile
#
# sets up the frontend container
#
# created by: CJ Quintero
# created on: 11/07/2026

# use node v26 as the base image
FROM node:26

# set working directory
WORKDIR /app

# copy package files
COPY package.json package-lock.json ./

# install node packages
RUN npm ci

# copy the rest of the frontend files
COPY . .

# port to expose so you can reach the container on your system
EXPOSE 9000

# run the dev script
CMD ["npm", "run", "dev"]