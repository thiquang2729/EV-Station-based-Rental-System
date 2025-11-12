
FROM apache/nifi:latest


LABEL maintainer="admin"
LABEL description="Apache NiFi standalone instance with Single User Authentication for EV-Rental project"


ENV NIFI_WEB_HTTPS_PORT=8443 \
    SINGLE_USER_CREDENTIALS_USERNAME=admin \
    SINGLE_USER_CREDENTIALS_PASSWORD=evrental12345 \
    NIFI_SENSITIVE_PROPS_KEY=evrentalnifi123 \
    NIFI_HOME=/opt/nifi/nifi-current


EXPOSE 8443


