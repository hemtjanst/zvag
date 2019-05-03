FROM node:alpine

RUN apk add --update python make g++ openzwave-dev openzwave bash && \
  rm -rf /var/cache/apk/*
ADD package.json package-lock.json /app/
RUN cd /app && npm update
ADD . /app/
RUN cd /app && npm run build
RUN echo "#!/bin/bash" > /usr/local/bin/zvag && \
  echo "exec node /app/dist/cli.js \$*" >> /usr/local/bin/zvag && \
  chmod a+x /usr/local/bin/zvag

ENV DEBUG "*"

ENTRYPOINT ["zvag"]
