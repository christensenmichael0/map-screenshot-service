# from base image node
FROM node:14.15.1-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# copying all the files from your file system to container file system
COPY package.json .

# install all dependencies
RUN npm install

# copy other files as well
COPY ./ .

#expose the port
EXPOSE 5005

# command to run when intantiate an image
CMD ["npm","run","start:dev"]
