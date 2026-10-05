# Included per location: nginx drops inherited add_header lines in any
# location that sets its own
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
# The app controls a heater; it must not be framed by another site
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header Permissions-Policy "bluetooth=(self), camera=(), microphone=(), geolocation=()" always;
