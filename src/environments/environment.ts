const isBrowser = typeof window !== 'undefined';
const host = isBrowser && window.location.hostname ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${host}:8080/api`,
  stripePublishableKey: 'pk_test_51S88J5F30XYgfrgVDNixlIFUVK9HphUlvSTFcG6IuoAheSQL2NBY95v9Zqy8xUY4WdREAJwOUW3FP3QmgsYwCq9400y8Ov9b6x'
};
