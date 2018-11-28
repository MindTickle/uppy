FROM node:8.11.4-alpine

ENV UPPYBASEPATH=packages/@uppy/companion
#COPY $UPPYBASEPATH/package.json /app/package.json

WORKDIR /app

# Install node_modules
# * to optionally copy lock files that _might_ _not_ exist
ADD $UPPYBASEPATH/package.json $UPPYBASEPATH/package-*.json $UPPYBASEPATH/yarn.* /tmp/
RUN apk --update add  --virtual native-dep \
  make gcc g++ python libgcc libstdc++ && \
  apk del native-dep
RUN ls /tmp
RUN cat /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /tmp/uppy
RUN mkdir -p /app && cd /app && ln -nfs /tmp/node_modules
RUN apk add bash
COPY $UPPYBASEPATH/ /app
ENV PATH "${PATH}:/app/node_modules/.bin"
RUN npm run build

RUN chmod +x /app/docker-entrypoint.sh
CMD ["/app/docker-entrypoint.sh"]
# This can be overruled later
EXPOSE 80
