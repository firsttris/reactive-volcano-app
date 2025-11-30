# Use lightweight Apache image
FROM httpd:2.4-alpine

# Remove default Apache content
RUN rm -rf /usr/local/apache2/htdocs/*

# Enable mod_rewrite
RUN sed -i \
    -e 's/#LoadModule rewrite_module/LoadModule rewrite_module/' \
    /usr/local/apache2/conf/httpd.conf

# Append proper Directory block
RUN cat << 'EOF' >> /usr/local/apache2/conf/httpd.conf

<Directory "/usr/local/apache2/htdocs">
    AllowOverride All
    Require all granted

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    RewriteRule ^ /index.html [L]
</Directory>

EOF
# Copy your locally built dist/ folder into Apache root
COPY dist/ /usr/local/apache2/htdocs/

# Expose port 80
EXPOSE 80

# Start Apache in the foreground
CMD ["httpd-foreground"]
