# Use lightweight Apache image
FROM httpd:2.4-alpine

# Remove default Apache content
RUN rm -rf /usr/local/apache2/htdocs/*

# Copy your locally built dist/ folder into Apache root
COPY dist/* /usr/local/apache2/htdocs/

# Expose port 80
EXPOSE 80

# Start Apache in the foreground
CMD ["httpd-foreground"]
