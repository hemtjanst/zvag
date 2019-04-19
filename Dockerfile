FROM node:alpine
ADD . /app/

RUN apk add --update python make g++ openzwave-dev openzwave bash && \
  rm -rf /var/cache/apk/*
RUN cd /app && \
  npm update && \
  npm run build
RUN echo "#!/bin/bash" > /usr/local/bin/zvag && \
  echo "node /app/dist/cli.js \$*" >> /usr/local/bin/zvag && \
  chmod a+x /usr/local/bin/zvag

ENV DEBUG "*"

ENTRYPOINT ["zvag"]
