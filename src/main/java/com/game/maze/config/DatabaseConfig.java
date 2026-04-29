package com.game.maze.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        String sqlScores = "CREATE TABLE IF NOT EXISTS scores (" +
                     "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                     "name VARCHAR(255) NOT NULL, " +
                     "score INT NOT NULL, " +
                     "level INT NOT NULL, " +
                     "time INT NOT NULL" +
                     ")";
        jdbcTemplate.execute(sqlScores);

        String sqlUsers = "CREATE TABLE IF NOT EXISTS users (" +
                     "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                     "username VARCHAR(255) UNIQUE NOT NULL, " +
                     "password VARCHAR(255) NOT NULL" +
                     ")";
        jdbcTemplate.execute(sqlUsers);
    }
}
