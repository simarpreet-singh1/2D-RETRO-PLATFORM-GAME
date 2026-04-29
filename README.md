# 2d retro platfrom  Game

A full-stack 3D  maze game using Three.js and Spring Boot.

## Prerequisites
- **Java 17+** (Required for Spring Boot backend)
- **MySQL** (Required for the database)

## Setup

1. **Database:**
   Ensure MySQL is running on `localhost:3306`.
   Create a database named `maze_game`:
   ```sql
   CREATE DATABASE maze_game;
   ```
   *Note: Update `backend/src/main/resources/application.properties` with your MySQL root username and password if it's different from `root`/`password`.*

2. **Run the Game:**
   The frontend is now bundled within the Spring Boot application for easier execution.
   
   Navigate to the `backend` directory and run the Spring Boot application:
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
   
3. **Access the Game:**
   Once the backend starts, open your browser and go to:
   [http://localhost:8080](http://localhost:8080)

## Controls
- **W, A, S, D** to move the player.
- Reach the cyan exit zone to progress to the next level.
- Avoid the red enemies' line of sight!

## Troubleshooting
- If `.\mvnw.cmd` fails, make sure you are inside the `backend` directory.
- If the game doesn't load, check if any other service is using port `8080`.
