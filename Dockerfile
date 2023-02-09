FROM node:lts-alpine3.16
WORKDIR /usr/src/app
COPY . .
RUN yarn install --prod
EXPOSE 3001
CMD ["yarn", "start"]