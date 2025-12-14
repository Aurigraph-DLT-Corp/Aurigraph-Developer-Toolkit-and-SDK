# Use the official OpenJDK 21 image as a parent image
FROM openjdk:21-ei

# Set the working directory to /app
WORKDIR /app

# Copy the executable JAR file to the container
COPY target/*-runner.jar application.jar

# Make port 9003 available to the world outside this container
EXPOSE 9003

# Run the JAR file
CMD ["java", "-jar", "application.jar"]
