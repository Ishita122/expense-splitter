# Use a lightweight Nginx image to serve static files
FROM nginx:alpine

# Copy local frontend files into Nginx default serving directory
COPY . /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
